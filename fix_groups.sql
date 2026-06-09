-- ═══════════════════════════════════════════════════════════
-- CORRECCIÓN GRUPOS REALES MUNDIAL 2026
-- Borrar datos incorrectos y reinsertar los 72 partidos reales
-- ═══════════════════════════════════════════════════════════

-- Limpiar predicciones y partidos existentes
DELETE FROM predictions;
DELETE FROM podium_predictions;
DELETE FROM matches;

-- Resetear secuencia de IDs
ALTER SEQUENCE matches_id_seq RESTART WITH 1;

-- ─── GRUPO A: México, Sudáfrica, Corea del Sur, Chequia ───
INSERT INTO matches (phase, group_label, home, away, match_date, kickoff_time, venue) VALUES
('Grupo A','A','🇲🇽 México','🇿🇦 Sudáfrica','2026-06-11','17:00','Estadio Azteca, Ciudad de México'),
('Grupo A','A','🇰🇷 Corea del Sur','🇨🇿 Chequia','2026-06-11','20:00','Estadio Akron, Guadalajara'),
('Grupo A','A','🇲🇽 México','🇰🇷 Corea del Sur','2026-06-15','14:00','Estadio Azteca, Ciudad de México'),
('Grupo A','A','🇿🇦 Sudáfrica','🇨🇿 Chequia','2026-06-15','17:00','Estadio Akron, Guadalajara'),
('Grupo A','A','🇨🇿 Chequia','🇲🇽 México','2026-06-19','16:00','Estadio Akron, Guadalajara'),
('Grupo A','A','🇿🇦 Sudáfrica','🇰🇷 Corea del Sur','2026-06-19','16:00','Estadio Azteca, Ciudad de México'),

-- ─── GRUPO B: Canadá, Bosnia-Herzegovina, Qatar, Suiza ───
('Grupo B','B','🇨🇦 Canadá','🇧🇦 Bosnia-Herzegovina','2026-06-12','19:00','BMO Field, Toronto'),
('Grupo B','B','🇶🇦 Qatar','🇨🇭 Suiza','2026-06-12','16:00','BC Place, Vancouver'),
('Grupo B','B','🇨🇦 Canadá','🇶🇦 Qatar','2026-06-16','19:00','BMO Field, Toronto'),
('Grupo B','B','🇧🇦 Bosnia-Herzegovina','🇨🇭 Suiza','2026-06-16','16:00','BC Place, Vancouver'),
('Grupo B','B','🇨🇭 Suiza','🇨🇦 Canadá','2026-06-20','16:00','BC Place, Vancouver'),
('Grupo B','B','🇧🇦 Bosnia-Herzegovina','🇶🇦 Qatar','2026-06-20','16:00','BMO Field, Toronto'),

-- ─── GRUPO C: Brasil, Marruecos, Haití, Escocia ───
('Grupo C','C','🇧🇷 Brasil','🇲🇦 Marruecos','2026-06-13','19:00','SoFi Stadium, Inglewood'),
('Grupo C','C','🇭🇹 Haití','🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia','2026-06-13','16:00','Lumen Field, Seattle'),
('Grupo C','C','🇧🇷 Brasil','🇭🇹 Haití','2026-06-17','19:00','SoFi Stadium, Inglewood'),
('Grupo C','C','🇲🇦 Marruecos','🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia','2026-06-17','16:00','Lumen Field, Seattle'),
('Grupo C','C','🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia','🇧🇷 Brasil','2026-06-21','16:00','SoFi Stadium, Inglewood'),
('Grupo C','C','🇲🇦 Marruecos','🇭🇹 Haití','2026-06-21','16:00','Lumen Field, Seattle'),

-- ─── GRUPO D: Estados Unidos, Paraguay, Australia, Turquía ───
('Grupo D','D','🇺🇸 Estados Unidos','🇵🇾 Paraguay','2026-06-12','22:00','SoFi Stadium, Inglewood'),
('Grupo D','D','🇦🇺 Australia','🇹🇷 Turquía','2026-06-12','19:00','Arrowhead Stadium, Kansas City'),
('Grupo D','D','🇺🇸 Estados Unidos','🇦🇺 Australia','2026-06-16','22:00','SoFi Stadium, Inglewood'),
('Grupo D','D','🇵🇾 Paraguay','🇹🇷 Turquía','2026-06-16','19:00','Arrowhead Stadium, Kansas City'),
('Grupo D','D','🇹🇷 Turquía','🇺🇸 Estados Unidos','2026-06-20','20:00','Arrowhead Stadium, Kansas City'),
('Grupo D','D','🇵🇾 Paraguay','🇦🇺 Australia','2026-06-20','20:00','SoFi Stadium, Inglewood'),

-- ─── GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador ───
('Grupo E','E','🇩🇪 Alemania','🇨🇼 Curazao','2026-06-13','22:00','Allegiant Stadium, Las Vegas'),
('Grupo E','E','🇨🇮 Costa de Marfil','🇪🇨 Ecuador','2026-06-13','19:00','AT&T Stadium, Dallas'),
('Grupo E','E','🇩🇪 Alemania','🇨🇮 Costa de Marfil','2026-06-17','22:00','Allegiant Stadium, Las Vegas'),
('Grupo E','E','🇨🇼 Curazao','🇪🇨 Ecuador','2026-06-17','19:00','AT&T Stadium, Dallas'),
('Grupo E','E','🇪🇨 Ecuador','🇩🇪 Alemania','2026-06-21','20:00','AT&T Stadium, Dallas'),
('Grupo E','E','🇨🇼 Curazao','🇨🇮 Costa de Marfil','2026-06-21','20:00','Allegiant Stadium, Las Vegas'),

-- ─── GRUPO F: Países Bajos, Japón, Suecia, Túnez ───
('Grupo F','F','🇳🇱 Países Bajos','🇯🇵 Japón','2026-06-14','19:00','Gillette Stadium, Boston'),
('Grupo F','F','🇸🇪 Suecia','🇹🇳 Túnez','2026-06-14','16:00','Hard Rock Stadium, Miami'),
('Grupo F','F','🇳🇱 Países Bajos','🇸🇪 Suecia','2026-06-18','19:00','Gillette Stadium, Boston'),
('Grupo F','F','🇯🇵 Japón','🇹🇳 Túnez','2026-06-18','16:00','Hard Rock Stadium, Miami'),
('Grupo F','F','🇹🇳 Túnez','🇳🇱 Países Bajos','2026-06-22','16:00','Hard Rock Stadium, Miami'),
('Grupo F','F','🇸🇪 Suecia','🇯🇵 Japón','2026-06-22','16:00','Gillette Stadium, Boston'),

-- ─── GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda ───
('Grupo G','G','🇧🇪 Bélgica','🇪🇬 Egipto','2026-06-14','22:00','Lumen Field, Seattle'),
('Grupo G','G','🇮🇷 Irán','🇳🇿 Nueva Zelanda','2026-06-14','19:00','Allegiant Stadium, Las Vegas'),
('Grupo G','G','🇧🇪 Bélgica','🇮🇷 Irán','2026-06-18','22:00','Lumen Field, Seattle'),
('Grupo G','G','🇪🇬 Egipto','🇳🇿 Nueva Zelanda','2026-06-18','19:00','Allegiant Stadium, Las Vegas'),
('Grupo G','G','🇳🇿 Nueva Zelanda','🇧🇪 Bélgica','2026-06-22','20:00','Allegiant Stadium, Las Vegas'),
('Grupo G','G','🇪🇬 Egipto','🇮🇷 Irán','2026-06-22','20:00','Lumen Field, Seattle'),

-- ─── GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay ───
('Grupo H','H','🇪🇸 España','🇨🇻 Cabo Verde','2026-06-15','19:00','MetLife Stadium, Nueva York'),
('Grupo H','H','🇸🇦 Arabia Saudita','🇺🇾 Uruguay','2026-06-15','16:00','Estadio BBVA, Monterrey'),
('Grupo H','H','🇪🇸 España','🇸🇦 Arabia Saudita','2026-06-19','19:00','MetLife Stadium, Nueva York'),
('Grupo H','H','🇨🇻 Cabo Verde','🇺🇾 Uruguay','2026-06-19','16:00','Estadio BBVA, Monterrey'),
('Grupo H','H','🇺🇾 Uruguay','🇪🇸 España','2026-06-23','16:00','Estadio BBVA, Monterrey'),
('Grupo H','H','🇨🇻 Cabo Verde','🇸🇦 Arabia Saudita','2026-06-23','16:00','MetLife Stadium, Nueva York'),

-- ─── GRUPO I: Francia, Senegal, Irak, Noruega ───
('Grupo I','I','🇫🇷 Francia','🇸🇳 Senegal','2026-06-15','22:00','MetLife Stadium, Nueva York'),
('Grupo I','I','🇮🇶 Irak','🇳🇴 Noruega','2026-06-15','19:00','NRG Stadium, Houston'),
('Grupo I','I','🇫🇷 Francia','🇮🇶 Irak','2026-06-19','22:00','MetLife Stadium, Nueva York'),
('Grupo I','I','🇸🇳 Senegal','🇳🇴 Noruega','2026-06-19','19:00','NRG Stadium, Houston'),
('Grupo I','I','🇳🇴 Noruega','🇫🇷 Francia','2026-06-23','20:00','NRG Stadium, Houston'),
('Grupo I','I','🇮🇶 Irak','🇸🇳 Senegal','2026-06-23','20:00','MetLife Stadium, Nueva York'),

-- ─── GRUPO J: Argentina, Argelia, Austria, Jordania ───
('Grupo J','J','🇦🇷 Argentina','🇩🇿 Argelia','2026-06-16','19:00','Mercedes-Benz Stadium, Atlanta'),
('Grupo J','J','🇦🇹 Austria','🇯🇴 Jordania','2026-06-16','16:00','Lincoln Financial Field, Filadelfia'),
('Grupo J','J','🇦🇷 Argentina','🇦🇹 Austria','2026-06-20','19:00','Mercedes-Benz Stadium, Atlanta'),
('Grupo J','J','🇩🇿 Argelia','🇯🇴 Jordania','2026-06-20','16:00','Lincoln Financial Field, Filadelfia'),
('Grupo J','J','🇯🇴 Jordania','🇦🇷 Argentina','2026-06-24','16:00','Lincoln Financial Field, Filadelfia'),
('Grupo J','J','🇦🇹 Austria','🇩🇿 Argelia','2026-06-24','16:00','Mercedes-Benz Stadium, Atlanta'),

-- ─── GRUPO K: Portugal, DR Congo, Uzbekistán, Colombia ───
('Grupo K','K','🇵🇹 Portugal','🇨🇩 DR Congo','2026-06-16','22:00','Cotton Bowl, Dallas'),
('Grupo K','K','🇺🇿 Uzbekistán','🇨🇴 Colombia','2026-06-16','19:00','Bank of America Stadium, Charlotte'),
('Grupo K','K','🇵🇹 Portugal','🇺🇿 Uzbekistán','2026-06-20','22:00','Cotton Bowl, Dallas'),
('Grupo K','K','🇨🇩 DR Congo','🇨🇴 Colombia','2026-06-20','19:00','Bank of America Stadium, Charlotte'),
('Grupo K','K','🇨🇴 Colombia','🇵🇹 Portugal','2026-06-24','20:00','Bank of America Stadium, Charlotte'),
('Grupo K','K','🇨🇩 DR Congo','🇺🇿 Uzbekistán','2026-06-24','20:00','Cotton Bowl, Dallas'),

-- ─── GRUPO L: Inglaterra, Croacia, Ghana, Panamá ───
('Grupo L','L','🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra','🇭🇷 Croacia','2026-06-17','19:00','Camping World Stadium, Orlando'),
('Grupo L','L','🇬🇭 Ghana','🇵🇦 Panamá','2026-06-17','16:00','State Farm Stadium, Glendale'),
('Grupo L','L','🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra','🇬🇭 Ghana','2026-06-21','19:00','Camping World Stadium, Orlando'),
('Grupo L','L','🇭🇷 Croacia','🇵🇦 Panamá','2026-06-21','16:00','State Farm Stadium, Glendale'),
('Grupo L','L','🇵🇦 Panamá','🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra','2026-06-25','16:00','State Farm Stadium, Glendale'),
('Grupo L','L','🇬🇭 Ghana','🇭🇷 Croacia','2026-06-25','16:00','Camping World Stadium, Orlando'),

-- ─── OCTAVOS DE FINAL ─────────────────────────────────────
('Octavos',NULL,'1° Grupo A','2° Grupo B','2026-06-29','14:00','MetLife Stadium, Nueva York'),
('Octavos',NULL,'1° Grupo C','2° Grupo D','2026-06-29','18:00','AT&T Stadium, Dallas'),
('Octavos',NULL,'1° Grupo E','2° Grupo F','2026-06-30','14:00','SoFi Stadium, Inglewood'),
('Octavos',NULL,'1° Grupo G','2° Grupo H','2026-06-30','18:00','Estadio Azteca, Ciudad de México'),
('Octavos',NULL,'1° Grupo B','2° Grupo A','2026-07-01','14:00','NRG Stadium, Houston'),
('Octavos',NULL,'1° Grupo D','2° Grupo C','2026-07-01','18:00','BC Place, Vancouver'),
('Octavos',NULL,'1° Grupo F','2° Grupo E','2026-07-02','14:00','Gillette Stadium, Boston'),
('Octavos',NULL,'1° Grupo H','2° Grupo G','2026-07-02','18:00','Estadio BBVA, Monterrey'),
('Octavos',NULL,'1° Grupo I','2° Grupo J','2026-07-03','14:00','Hard Rock Stadium, Miami'),
('Octavos',NULL,'1° Grupo K','2° Grupo L','2026-07-03','18:00','Cotton Bowl, Dallas'),
('Octavos',NULL,'1° Grupo J','2° Grupo I','2026-07-04','14:00','Mercedes-Benz Stadium, Atlanta'),
('Octavos',NULL,'1° Grupo L','2° Grupo K','2026-07-04','18:00','Camping World Stadium, Orlando'),

-- ─── CUARTOS DE FINAL ─────────────────────────────────────
('Cuartos',NULL,'Ganador R1','Ganador R3','2026-07-08','14:00','MetLife Stadium, Nueva York'),
('Cuartos',NULL,'Ganador R2','Ganador R4','2026-07-08','18:00','SoFi Stadium, Inglewood'),
('Cuartos',NULL,'Ganador R5','Ganador R7','2026-07-09','14:00','NRG Stadium, Houston'),
('Cuartos',NULL,'Ganador R6','Ganador R8','2026-07-09','18:00','Estadio Azteca, Ciudad de México'),
('Cuartos',NULL,'Ganador R9','Ganador R11','2026-07-10','14:00','AT&T Stadium, Dallas'),
('Cuartos',NULL,'Ganador R10','Ganador R12','2026-07-10','18:00','Hard Rock Stadium, Miami'),

-- ─── SEMIFINALES ──────────────────────────────────────────
('Semifinales',NULL,'Ganador QF1','Ganador QF2','2026-07-14','20:00','MetLife Stadium, Nueva York'),
('Semifinales',NULL,'Ganador QF3','Ganador QF4','2026-07-15','20:00','AT&T Stadium, Dallas'),
('Semifinales',NULL,'Ganador QF5','Ganador QF6','2026-07-16','20:00','SoFi Stadium, Inglewood'),

-- ─── 3ER PUESTO ───────────────────────────────────────────
('3er Puesto',NULL,'Perdedor SF1','Perdedor SF2','2026-07-18','16:00','Hard Rock Stadium, Miami'),
('3er Puesto',NULL,'Perdedor SF3','Perdedor SF4','2026-07-18','20:00','MetLife Stadium, Nueva York'),

-- ─── FINAL ────────────────────────────────────────────────
('Final',NULL,'Clasificado 1','Clasificado 2','2026-07-19','17:00','MetLife Stadium, Nueva York');
