CREATE TYPE match_status AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'COMPLETED');

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES straw_listings(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES buyer_requirements(id) ON DELETE CASCADE,
    baler_id UUID REFERENCES baler_profiles(id) ON DELETE SET NULL,
    matched_quantity_kg DECIMAL(12, 2) NOT NULL CHECK (matched_quantity_kg > 0),
    agreed_price_per_kg DECIMAL(10, 2) CHECK (agreed_price_per_kg >= 0),
    match_score DECIMAL(5, 2) CHECK (match_score >= 0 AND match_score <= 100),
    status match_status NOT NULL DEFAULT 'PROPOSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_listing_id ON matches(listing_id);
CREATE INDEX idx_matches_requirement_id ON matches(requirement_id);
CREATE INDEX idx_matches_baler_id ON matches(baler_id);
CREATE INDEX idx_matches_status ON matches(status);
