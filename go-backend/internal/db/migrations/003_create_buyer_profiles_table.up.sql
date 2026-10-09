CREATE TYPE buyer_type AS ENUM ('BIOMASS_PLANT', 'BRICK_KILN', 'PAPER_MILL', 'CATTLE_FEED', 'OTHER');

CREATE TABLE buyer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    buyer_type buyer_type NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11, 8) CHECK (longitude >= -180 AND longitude <= 180),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_profiles_user_id ON buyer_profiles(user_id);
