CREATE TYPE requirement_status AS ENUM ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

CREATE TABLE buyer_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
    crop_type VARCHAR(100) NOT NULL,
    quantity_required_kg DECIMAL(12, 2) NOT NULL CHECK (quantity_required_kg > 0),
    remaining_quantity_kg DECIMAL(12, 2) NOT NULL CHECK (remaining_quantity_kg >= 0 AND remaining_quantity_kg <= quantity_required_kg),
    max_price_per_kg DECIMAL(10, 2) CHECK (max_price_per_kg >= 0),
    preferred_radius_km DECIMAL(8, 2) CHECK (preferred_radius_km > 0),
    required_from DATE NOT NULL,
    required_until DATE NOT NULL,
    status requirement_status NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (required_until >= required_from)
);

CREATE INDEX idx_buyer_requirements_buyer_id ON buyer_requirements(buyer_id);
CREATE INDEX idx_buyer_requirements_status ON buyer_requirements(status);
CREATE INDEX idx_buyer_requirements_crop_type ON buyer_requirements(crop_type);
