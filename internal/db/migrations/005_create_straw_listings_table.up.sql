CREATE TYPE listing_status AS ENUM ('AVAILABLE', 'MATCHED', 'BOOKED', 'COLLECTED', 'CANCELLED');

CREATE TABLE straw_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    crop_type VARCHAR(100) NOT NULL,
    quantity_kg DECIMAL(12, 2) NOT NULL CHECK (quantity_kg > 0),
    price_per_kg DECIMAL(10, 2) CHECK (price_per_kg >= 0),
    moisture_percentage DECIMAL(5, 2) CHECK (moisture_percentage >= 0 AND moisture_percentage <= 100),
    harvest_date DATE NOT NULL,
    available_from DATE NOT NULL,
    available_until DATE NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL CHECK (pickup_latitude >= -90 AND pickup_latitude <= 90),
    pickup_longitude DECIMAL(11, 8) NOT NULL CHECK (pickup_longitude >= -180 AND pickup_longitude <= 180),
    status listing_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (available_until >= available_from)
);

CREATE INDEX idx_straw_listings_farmer_id ON straw_listings(farmer_id);
CREATE INDEX idx_straw_listings_status ON straw_listings(status);
CREATE INDEX idx_straw_listings_crop_type ON straw_listings(crop_type);
CREATE INDEX idx_straw_listings_location ON straw_listings(pickup_latitude, pickup_longitude);
