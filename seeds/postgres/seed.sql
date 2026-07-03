INSERT INTO users (id, first_name, last_name, email, role) VALUES
('user_001', 'Alice', 'Martin', 'alice.martin@example.com', 'student'),
('user_002', 'Nassim', 'Benali', 'nassim.benali@example.com', 'student'),
('user_003', 'Chloé', 'Durand', 'chloe.durand@example.com', 'student'),
('user_004', 'Yanis', 'Morel', 'yanis.morel@example.com', 'student'),
('user_005', 'Emma', 'Petit', 'emma.petit@example.com', 'librarian'),
('user_006', 'Lucas', 'Bernard', 'lucas.bernard@example.com', 'student'),
('user_007', 'Inès', 'Robert', 'ines.robert@example.com', 'student'),
('user_008', 'Mehdi', 'Leroy', 'mehdi.leroy@example.com', 'student');

INSERT INTO books (id, title, author, published_year, category, status) VALUES
('book_001', 'Dune', 'Frank Herbert', 1965, 'science-fiction', 'borrowed'),
('book_002', '1984', 'George Orwell', 1949, 'dystopie', 'available'),
('book_003', 'Le Petit Prince', 'Antoine de Saint-Exupéry', 1943, 'conte', 'available'),
('book_004', 'L''Étranger', 'Albert Camus', 1942, 'roman', 'borrowed'),
('book_005', 'Harry Potter à l''école des sorciers', 'J. K. Rowling', 1997, 'fantasy', 'reserved'),
('book_006', 'Fondation', 'Isaac Asimov', 1951, 'science-fiction', 'available'),
('book_007', 'Les Misérables', 'Victor Hugo', 1862, 'classique', 'available'),
('book_008', 'Fahrenheit 451', 'Ray Bradbury', 1953, 'dystopie', 'borrowed'),
('book_009', 'La Nuit des temps', 'René Barjavel', 1968, 'science-fiction', 'available'),
('book_010', 'Le Seigneur des Anneaux', 'J. R. R. Tolkien', 1954, 'fantasy', 'reserved');

INSERT INTO loans (id, user_id, book_id, borrowed_at, due_at, returned_at, status) VALUES
('loan_001', 'user_001', 'book_001', '2025-10-01', '2025-10-21', NULL, 'active'),
('loan_002', 'user_003', 'book_004', '2025-10-03', '2025-10-23', NULL, 'active'),
('loan_003', 'user_004', 'book_008', '2025-09-28', '2025-10-18', NULL, 'late'),
('loan_004', 'user_002', 'book_003', '2025-09-01', '2025-09-21', '2025-09-18', 'returned'),
('loan_005', 'user_006', 'book_006', '2025-09-10', '2025-09-30', '2025-09-29', 'returned');

INSERT INTO reservations (id, user_id, book_id, reserved_at, status) VALUES
('reservation_001', 'user_002', 'book_001', '2025-10-05', 'waiting'),
('reservation_002', 'user_007', 'book_005', '2025-10-06', 'waiting'),
('reservation_003', 'user_008', 'book_010', '2025-10-07', 'waiting'),
('reservation_004', 'user_004', 'book_002', '2025-09-15', 'cancelled');