-- Migration: Validate and decrement stock on order insert
CREATE OR REPLACE FUNCTION public.validate_and_decrement_stock()
RETURNS TRIGGER AS $$
DECLARE
  item jsonb;
  prod_id uuid;
  item_sku text;
  item_size text;
  item_qty int;
  available_qty int;
  prod_title text;
  prod_stock jsonb;
BEGIN
  -- Loop through each item in the order
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    -- Cast product_id to uuid safely if it is present
    IF item->>'product_id' IS NOT NULL AND item->>'product_id' != '' THEN
      prod_id := (item->>'product_id')::uuid;
    ELSE
      prod_id := NULL;
    END IF;
    
    item_sku := item->>'sku';
    item_size := item->>'size';
    item_qty := (item->>'qty')::int;

    IF prod_id IS NOT NULL AND item_size IS NOT NULL AND item_qty IS NOT NULL THEN
      -- Lock the product row for update to prevent race conditions
      SELECT title, stock_by_size INTO prod_title, prod_stock
      FROM public.products
      WHERE id = prod_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % (SKU %) not found in catalog.', item_sku, prod_id;
      END IF;

      -- Check available stock
      IF prod_stock ? item_size THEN
        available_qty := (prod_stock->>item_size)::int;
      ELSE
        available_qty := 0;
      END IF;

      IF available_qty < item_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Size %). Requested: %, Available: %.', 
          prod_title, item_size, item_qty, available_qty;
      END IF;

      -- Update the product's stock_by_size
      UPDATE public.products
      SET stock_by_size = jsonb_set(stock_by_size, ARRAY[item_size], to_jsonb(available_qty - item_qty))
      WHERE id = prod_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow safe re-runs/updates
DROP TRIGGER IF EXISTS trg_orders_validate_and_decrement_stock ON public.orders;

CREATE TRIGGER trg_orders_validate_and_decrement_stock
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_decrement_stock();
