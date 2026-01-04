-- Checkout and Payment System
-- Handles billing, payment collection, and transaction tracking

-- Fee schedule for CPT codes
CREATE TABLE fee_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    cpt_code TEXT NOT NULL,
    description TEXT,
    standard_fee DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(practice_id, cpt_code, effective_date)
);

-- Patient account balances
CREATE TABLE patient_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0,
    last_payment_date TIMESTAMPTZ,
    last_payment_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(practice_id, patient_id)
);

-- Checkout transactions
CREATE TABLE checkout_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),

    -- Medical charges (from CPT codes)
    medical_charges JSONB DEFAULT '[]', -- [{cpt_code, description, fee, patient_responsibility, insurance_info}]
    medical_total DECIMAL(10, 2) DEFAULT 0,

    -- Cosmetic charges
    cosmetic_charges JSONB DEFAULT '[]', -- [{treatment_type, product, units, price_per_unit, subtotal}]
    cosmetic_subtotal DECIMAL(10, 2) DEFAULT 0,

    -- Discounts applied to cosmetic
    discounts_applied JSONB DEFAULT '[]', -- [{type: 'alle'|'aspire'|'custom', amount, description}]
    total_discounts DECIMAL(10, 2) DEFAULT 0,
    cosmetic_total DECIMAL(10, 2) DEFAULT 0, -- After discounts

    -- Product sales
    product_charges JSONB DEFAULT '[]', -- [{product_id, product_name, quantity, unit_price, subtotal}]
    products_total DECIMAL(10, 2) DEFAULT 0,

    -- Account balance
    previous_balance DECIMAL(10, 2) DEFAULT 0,

    -- Total and payment
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    amount_remaining DECIMAL(10, 2) DEFAULT 0,

    -- Payment details
    payment_method TEXT, -- 'cash', 'card', 'check', 'split'
    payment_details JSONB, -- {card_last4, check_number, split_payments: [{method, amount}]}
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'refunded'

    -- Metadata
    processed_by UUID REFERENCES staff(id),
    processed_at TIMESTAMPTZ,
    receipt_printed BOOLEAN DEFAULT FALSE,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history (for tracking individual payments on a transaction)
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES checkout_transactions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_details JSONB,
    processed_by UUID REFERENCES staff(id),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default fee schedule for common CPT codes
INSERT INTO fee_schedule (practice_id, cpt_code, description, standard_fee)
SELECT
    id as practice_id,
    cpt_code,
    description,
    standard_fee
FROM practices, (VALUES
    ('99213', 'Office visit, established patient, level 3', 150.00),
    ('99214', 'Office visit, established patient, level 4', 200.00),
    ('99215', 'Office visit, established patient, level 5', 275.00),
    ('99203', 'Office visit, new patient, level 3', 175.00),
    ('99204', 'Office visit, new patient, level 4', 250.00),
    ('99205', 'Office visit, new patient, level 5', 350.00),
    ('11102', 'Tangential biopsy of skin', 250.00),
    ('11104', 'Punch biopsy of skin', 200.00),
    ('17000', 'Destruction, benign/premalignant lesion', 150.00),
    ('17110', 'Destruction of flat warts, up to 14 lesions', 175.00),
    ('17111', 'Destruction of flat warts, 15+ lesions', 225.00),
    ('96372', 'Therapeutic injection, subcutaneous/intramuscular', 50.00),
    ('11200', 'Removal of skin tags, first 15', 150.00)
) AS t(cpt_code, description, standard_fee);

-- Create indexes
CREATE INDEX idx_checkout_transactions_encounter ON checkout_transactions(encounter_id);
CREATE INDEX idx_checkout_transactions_patient ON checkout_transactions(patient_id);
CREATE INDEX idx_checkout_transactions_status ON checkout_transactions(payment_status);
CREATE INDEX idx_payment_history_transaction ON payment_history(transaction_id);
CREATE INDEX idx_fee_schedule_practice_code ON fee_schedule(practice_id, cpt_code);
CREATE INDEX idx_patient_accounts_patient ON patient_accounts(patient_id);
