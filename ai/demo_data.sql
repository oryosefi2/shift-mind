-- Insert demo demand history data for testing

-- Business ID that we know exists
DO $$
DECLARE
    demo_business_id UUID := '11111111-1111-1111-1111-111111111111';
    start_date DATE := CURRENT_DATE - INTERVAL '8 weeks';
    end_date DATE := CURRENT_DATE - INTERVAL '1 day';
    curr_date DATE := start_date;
    hour_val INTEGER;
    base_demand DECIMAL;
    random_factor DECIMAL;
    final_demand DECIMAL;
BEGIN
    -- Delete existing demo data
    DELETE FROM demand_history WHERE business_id = demo_business_id;
    
    -- Generate demand history for the past 8 weeks
    WHILE curr_date <= end_date LOOP
        FOR hour_val IN 0..23 LOOP
            -- Create realistic demand patterns
            CASE 
                WHEN hour_val BETWEEN 6 AND 8 THEN 
                    base_demand := 25.0; -- Morning rush
                WHEN hour_val BETWEEN 11 AND 14 THEN 
                    base_demand := 35.0; -- Lunch rush
                WHEN hour_val BETWEEN 17 AND 20 THEN 
                    base_demand := 40.0; -- Evening rush
                WHEN hour_val BETWEEN 21 AND 23 THEN 
                    base_demand := 15.0; -- Late evening
                WHEN hour_val BETWEEN 0 AND 5 THEN 
                    base_demand := 2.0;  -- Night time
                ELSE 
                    base_demand := 12.0; -- Regular hours
            END CASE;
            
            -- Add some weekly patterns (weekend vs weekday)
            IF EXTRACT(dow FROM curr_date) IN (0, 6) THEN -- Weekend
                base_demand := base_demand * 1.3; -- Busier weekends
            END IF;
            
            -- Add random variation (±30%)
            random_factor := 0.7 + (random() * 0.6);
            final_demand := base_demand * random_factor;
            
            -- Insert the record
            INSERT INTO demand_history (
                business_id,
                date,
                hour_of_day,
                demand_value,
                demand_type,
                department,
                created_at
            ) VALUES (
                demo_business_id,
                curr_date,
                hour_val,
                ROUND(final_demand, 2),
                'customers',
                'main',
                NOW() - (CURRENT_DATE - curr_date) * INTERVAL '1 day'
            );
        END LOOP;
        
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE 'Inserted % demand history records for business %', 
                (end_date - start_date + 1) * 24, demo_business_id;
END $$;
