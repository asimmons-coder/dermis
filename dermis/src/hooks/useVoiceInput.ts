import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognitionInterface
  webkitSpeechRecognition?: new () => SpeechRecognitionInterface
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Keep ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.log('Speech recognition not supported')
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser. Please use Chrome or Safari.')
      return
    }

    console.log('Speech recognition is supported')
    setIsSupported(true)

    try {
      const recognition = new SpeechRecognition() as SpeechRecognitionInterface
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('✅ Speech recognition started')
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript
        console.log('📝 Transcript:', transcript)
        onTranscriptRef.current(transcript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error, event)

        let errorMessage = 'An error occurred with speech recognition.'

        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.'
            setPermissionStatus('denied')
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          case 'aborted':
            // Don't show error for aborted
            setIsListening(false)
            return
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }

        setError(errorMessage)
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended')
        setIsListening(false)
      }

      recognitionRef.current = recognition
      console.log('Speech recognition initialized')
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err)
      setError('Failed to initialize speech recognition.')
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          console.error('Error stopping recognition:', err)
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const requestMicrophonePermission = useCallback(async () => {
    console.log('🎤 Requesting microphone permission...')
    setIsRequestingPermission(true)
    setError(null)

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      console.log('✅ Microphone permission granted!')
      mediaStreamRef.current = stream
      setPermissionStatus('granted')
      setIsRequestingPermission(false)

      return true
    } catch (err: any) {
      console.error('❌ Microphone permission error:', err.name, err.message, err)
      setIsRequestingPermission(false)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied')
        setError('Microphone access was denied. Click the microphone button again to try again, or check your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
      } else if (err.message === 'getUserMedia not supported') {
        setError('Your browser does not support microphone access.')
      } else {
        setError(`Failed to access microphone: ${err.message}. Please try again.`)
      }

      return false
    }
  }, [])

  const startListening = useCallback(async () => {
    console.log('▶️ Start listening called, permission status:', permissionStatus)

    if (!recognitionRef.current) {
      console.error('Recognition not initialized')
      setError('Speech recognition is not initialized.')
      return
    }

    if (isListening) {
      console.log('Already listening')
      return
    }

    // Always request permission on first click (or if denied, try again)
    if (permissionStatus !== 'granted') {
      console.log('Permission not granted, requesting...')
      const granted = await requestMicrophonePermission()
      if (!granted) {
        console.log('Permission was not granted')
        return
      }
      console.log('Permission was granted, continuing to start recognition')
    }

    setError(null)

    try {
      console.log('🎙️ Starting speech recognition...')
      recognitionRef.current.start()
    } catch (err: any) {
      console.error('Error starting recognition:', err)

      // If already started, stop and restart
      if (err.message && err.message.includes('already started')) {
        console.log('Already started, restarting...')
        try {
          recognitionRef.current.stop()
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start()
            }
          }, 100)
        } catch (restartErr) {
          console.error('Error restarting recognition:', restartErr)
          setError('Failed to start speech recognition.')
        }
      } else {
        setError('Failed to start speech recognition. Please try again.')
      }
    }
  }, [isListening, permissionStatus, requestMicrophonePermission])

  const stopListening = useCallback(() => {
    console.log('⏹️ Stop listening called')
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    console.log('🔄 Toggle listening, currently listening:', isListening)
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    error,
    permissionStatus,
    isRequestingPermission,
    toggleListening,
    startListening,
    stopListening,
  }
}
