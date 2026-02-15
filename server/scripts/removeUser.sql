-- SQL script to remove a user and all their related data
-- Usage: Run this in your Neon SQL editor or any PostgreSQL client

DO $$
DECLARE
    target_email VARCHAR := 'wmdeku@st.ug.edu.gh';
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- Delete dependent records first to avoid foreign key constraint violations
        
        -- 1. Delete Cart Items (via Carts)
        DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = target_user_id);
        
        -- 2. Delete Cart
        DELETE FROM carts WHERE user_id = target_user_id;
        
        -- 3. Delete Order Items (via Orders)
        DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = target_user_id);
        
        -- 4. Delete Coupon Usages
        DELETE FROM coupon_usages WHERE user_id = target_user_id;
        
        -- 5. Delete Orders
        DELETE FROM orders WHERE user_id = target_user_id;
        
        -- 6. Delete Reviews
        DELETE FROM reviews WHERE user_id = target_user_id;
        
        -- 7. Delete Wishlists
        DELETE FROM wishlists WHERE user_id = target_user_id;
        
        -- 8. Delete Review Helpful Votes
        DELETE FROM review_helpfuls WHERE user_id = target_user_id;

        -- 9. Finally, Delete the User
        DELETE FROM users WHERE id = target_user_id;
        
        RAISE NOTICE 'User % with ID % has been deleted along with all related data.', target_email, target_user_id;
    ELSE
        RAISE NOTICE 'User with email % was not found.', target_email;
    END IF;
END $$;