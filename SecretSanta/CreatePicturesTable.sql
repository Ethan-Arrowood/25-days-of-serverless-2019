USE secret_santa_pictures
GO
CREATE TABLE Pictures
(
    id INT IDENTITY NOT NULL PRIMARY KEY,
    url VARCHAR(1024) NOT NULL
)
GO