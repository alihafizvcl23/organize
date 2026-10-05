insert into public.menu_items (name, description, price, category, available)
select demo.name, demo.description, demo.price, demo.category, true
from (values
  ('Margherita Pizza', 'Tomato, mozzarella, and basil', 12.50::numeric, 'Mains'),
  ('Pasta Primavera', 'Seasonal vegetables with parmesan', 14.00::numeric, 'Mains'),
  ('House Salad', 'Mixed greens, cucumber, and vinaigrette', 8.50::numeric, 'Sides')
) as demo(name, description, price, category)
where not exists (
  select 1 from public.menu_items existing where existing.name = demo.name
);
