-- Warri and Effurun pickup points for the pilot.
-- Coordinates are approximate. Correct them from the ground before launch.
insert into places (id, name, area, lat, lng) values
  ('warri-main-market',   'Warri Main Market',            'Warri',    5.5167, 5.7500),
  ('effurun-roundabout',  'Effurun Roundabout',           'Effurun',  5.5560, 5.7830),
  ('pti-road',            'PTI Road',                     'Effurun',  5.5490, 5.7690),
  ('airport-road',        'Airport Road',                 'Effurun',  5.5720, 5.8080),
  ('deco-road',           'Deco Road',                    'Warri',    5.5310, 5.7440),
  ('okumagba-avenue',     'Okumagba Avenue',              'Warri',    5.5240, 5.7530),
  ('enerhen-junction',    'Enerhen Junction',             'Warri',    5.5410, 5.7720),
  ('ugborikoko',          'Ugborikoko',                   'Effurun',  5.5610, 5.7900),
  ('delta-mall',          'Delta Mall',                   'Effurun',  5.5580, 5.7960),
  ('warri-refinery-jcn',  'Refinery Junction',            'Ekpan',    5.5850, 5.7420),
  ('ekpan-market',        'Ekpan Market',                 'Ekpan',    5.5790, 5.7350),
  ('dsc-express',         'DSC Expressway',               'Warri',    5.5450, 5.7600),
  ('gra-warri',           'Warri GRA',                    'Warri',    5.5290, 5.7660),
  ('ovie-palace-road',    'Ovie Palace Road',             'Effurun',  5.5530, 5.7880),
  ('jakpa-road',          'Jakpa Road',                   'Effurun',  5.5500, 5.7950),
  ('federal-secretariat', 'Federal Secretariat',          'Warri',    5.5350, 5.7580)
on conflict (id) do nothing;
