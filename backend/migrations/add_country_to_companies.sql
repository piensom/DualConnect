-- Migration: Add country field to companies table
-- Date: 2025-11-14

ALTER TABLE companies ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Update existing companies with country based on city
-- Germany
UPDATE companies SET country = 'Germany' WHERE city IN ('Berlin', 'München', 'Hamburg', 'Frankfurt', 'Frankfurt am Main', 'Stuttgart', 'Walldorf', 'Wolfsburg', 'Düsseldorf', 'Essen', 'Bonn', 'Bielefeld', 'Gütersloh', 'Hannover', 'Herzogenaurach', 'Ingolstadt', 'Kaufering', 'Köln', 'Künzelsau', 'Leverkusen', 'Ludwigshafen', 'Mülheim an der Ruhr', 'Neckarsulm', 'Neubiberg', 'Schwalbach am Taunus', 'Winnenden', 'Esslingen am Neckar', 'Friedrichshafen');

-- Switzerland
UPDATE companies SET country = 'Switzerland' WHERE city IN ('Basel', 'Kloten', 'Zürich', 'Reinach', 'Worblaufen', 'Vevey');

-- Austria
UPDATE companies SET country = 'Austria' WHERE city IN ('Wien', 'Fuschl am See');

-- Denmark
UPDATE companies SET country = 'Denmark' WHERE city IN ('Copenhagen', 'Bagsværd', 'Billund');

-- Sweden
UPDATE companies SET country = 'Sweden' WHERE city IN ('Stockholm', 'Göteborg', 'Älmhult');

-- Netherlands
UPDATE companies SET country = 'Netherlands' WHERE city IN ('Amsterdam', 'Rotterdam');

-- France
UPDATE companies SET country = 'France' WHERE city IN ('Paris', 'Toulouse');

-- Spain
UPDATE companies SET country = 'Spain' WHERE city IN ('Madrid', 'Santander');

-- Italy (none currently but for future)
-- UPDATE companies SET country = 'Italy' WHERE city IN ();

-- United States
UPDATE companies SET country = 'United States' WHERE city IN ('Armonk', 'Boston', 'Chicago', 'Redmond');

-- Canada
UPDATE companies SET country = 'Canada' WHERE city IN ('Ottawa', 'Toronto');

-- Australia
UPDATE companies SET country = 'Australia' WHERE city IN ('Melbourne', 'Mascot');

-- India
UPDATE companies SET country = 'India' WHERE city IN ('Bangalore', 'Mumbai');

-- Japan
UPDATE companies SET country = 'Japan' WHERE city IN ('Tokyo', 'Toyota');

-- South Korea
UPDATE companies SET country = 'South Korea' WHERE city IN ('Seoul', 'Suwon');

-- Singapore
UPDATE companies SET country = 'Singapore' WHERE city IN ('Singapore');

-- Brazil
UPDATE companies SET country = 'Brazil' WHERE city IN ('São Paulo', 'Rio de Janeiro');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
