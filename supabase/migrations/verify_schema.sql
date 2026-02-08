-- Script to verify database schema for trip search functionality
-- Run this to check if all required columns and tables exist

DO $$
DECLARE
    v_result TEXT := '';
BEGIN
    RAISE NOTICE '=== Database Schema Verification ===';
    RAISE NOTICE '';
    
    -- Check buses table structure
    RAISE NOTICE '1. Checking buses table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buses') THEN
        RAISE NOTICE '   ✓ buses table exists';
        
        -- Check for class_id column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buses' AND column_name = 'class_id') THEN
            RAISE NOTICE '   ✓ buses.class_id exists';
        ELSE
            RAISE NOTICE '   ✗ buses.class_id does NOT exist (OK - not needed)';
        END IF;
        
        -- Check for capacity column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buses' AND column_name = 'capacity') THEN
            RAISE NOTICE '   ✓ buses.capacity exists';
        ELSE
            RAISE NOTICE '   ✗ buses.capacity does NOT exist';
        END IF;
        
        -- Check for model column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buses' AND column_name = 'model') THEN
            RAISE NOTICE '   ✓ buses.model exists';
        ELSE
            RAISE NOTICE '   ✗ buses.model does NOT exist';
        END IF;
    ELSE
        RAISE NOTICE '   ✗ buses table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check seats table structure
    RAISE NOTICE '2. Checking seats table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seats') THEN
        RAISE NOTICE '   ✓ seats table exists';
        
        -- Check for is_available column (should NOT exist)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seats' AND column_name = 'is_available') THEN
            RAISE NOTICE '   ✗ seats.is_available still EXISTS (should be removed!)';
        ELSE
            RAISE NOTICE '   ✓ seats.is_available does NOT exist (correct)';
        END IF;
    ELSE
        RAISE NOTICE '   ✗ seats table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check routes table structure
    RAISE NOTICE '3. Checking routes table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        RAISE NOTICE '   ✓ routes table exists';
        
        -- Check for origin_city
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'routes' AND column_name = 'origin_city') THEN
            RAISE NOTICE '   ✓ routes.origin_city exists';
        ELSE
            RAISE NOTICE '   ✗ routes.origin_city does NOT exist';
        END IF;
        
        -- Check for destination_city
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'routes' AND column_name = 'destination_city') THEN
            RAISE NOTICE '   ✓ routes.destination_city exists';
        ELSE
            RAISE NOTICE '   ✗ routes.destination_city does NOT exist';
        END IF;
        
        -- Check for from_stop_id (should NOT exist)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'routes' AND column_name = 'from_stop_id') THEN
            RAISE NOTICE '   ✓ routes.from_stop_id exists';
        ELSE
            RAISE NOTICE '   ✗ routes.from_stop_id does NOT exist (OK if using city names directly)';
        END IF;
    ELSE
        RAISE NOTICE '   ✗ routes table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check bus_classes table
    RAISE NOTICE '4. Checking bus_classes table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bus_classes') THEN
        RAISE NOTICE '   ✓ bus_classes table exists';
    ELSE
        RAISE NOTICE '   ✗ bus_classes table does NOT exist (OK if not using classes)';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check route_stops table
    RAISE NOTICE '5. Checking route_stops table...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_stops') THEN
        RAISE NOTICE '   ✓ route_stops table exists';
    ELSE
        RAISE NOTICE '   ✗ route_stops table does NOT exist (OK if using city names directly)';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check views
    RAISE NOTICE '6. Checking views...';
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_available_trips_for_search') THEN
        RAISE NOTICE '   ✓ v_available_trips_for_search view exists';
    ELSE
        RAISE NOTICE '   ✗ v_available_trips_for_search view does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_trip_details_for_booking') THEN
        RAISE NOTICE '   ✓ v_trip_details_for_booking view exists';
    ELSE
        RAISE NOTICE '   ✗ v_trip_details_for_booking view does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Verification Complete ===';
END $$;

-- Additional: Show actual columns in key tables
SELECT 
    'buses' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'buses'
ORDER BY ordinal_position;

SELECT 
    'routes' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'routes'
ORDER BY ordinal_position;

SELECT 
    'seats' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'seats'
ORDER BY ordinal_position;
