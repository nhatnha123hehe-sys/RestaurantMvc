IF DB_ID(N'RestaurantCNPMNC') IS NULL
BEGIN
    CREATE DATABASE RestaurantCNPMNC;
END
GO

USE RestaurantCNPMNC;
GO




IF OBJECT_ID('dbo.Users') IS NULL
BEGIN
CREATE TABLE dbo.Users (
 id INT IDENTITY PRIMARY KEY, username NVARCHAR(60) NOT NULL UNIQUE,
 passwordHash VARCHAR(180) NOT NULL, name NVARCHAR(100) NOT NULL,
 phone VARCHAR(15) NOT NULL DEFAULT '', role VARCHAR(20) NOT NULL
 CHECK(role IN ('customer','staff','admin')), createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.Categories (id INT IDENTITY PRIMARY KEY, name NVARCHAR(60) NOT NULL UNIQUE);
CREATE TABLE dbo.Dishes (
 id INT IDENTITY PRIMARY KEY, categoryId INT NOT NULL REFERENCES dbo.Categories(id),
 name NVARCHAR(100) NOT NULL, description NVARCHAR(500) NOT NULL DEFAULT '',
 price INT NOT NULL CHECK(price > 0), available BIT NOT NULL DEFAULT 1, visible BIT NOT NULL DEFAULT 1,
 art VARCHAR(20) NOT NULL DEFAULT 'rice', createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.RestaurantTables (
 id INT IDENTITY PRIMARY KEY, code NVARCHAR(20) NOT NULL UNIQUE,
 capacity INT NOT NULL CHECK(capacity BETWEEN 1 AND 30), enabled BIT NOT NULL DEFAULT 1
);
CREATE TABLE dbo.Reservations (
 id INT IDENTITY PRIMARY KEY, userId INT NOT NULL REFERENCES dbo.Users(id),
 tableId INT NOT NULL REFERENCES dbo.RestaurantTables(id), name NVARCHAR(100) NOT NULL,
 phone VARCHAR(15) NOT NULL, guests INT NOT NULL CHECK(guests > 0),
 startAt DATETIME2 NOT NULL, endAt DATETIME2 NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','seated')),
 note NVARCHAR(500) NOT NULL DEFAULT '', cancelReason NVARCHAR(300) NULL,
 createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CHECK(endAt > startAt)
);
CREATE INDEX IX_Reservation_Schedule ON dbo.Reservations(tableId,status,startAt,endAt);
CREATE TABLE dbo.DiningSessions (
 id INT IDENTITY PRIMARY KEY, tableId INT NOT NULL REFERENCES dbo.RestaurantTables(id),
 reservationId INT NOT NULL UNIQUE REFERENCES dbo.Reservations(id),
 userId INT NOT NULL REFERENCES dbo.Users(id),
 status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK(status IN ('open','billing','closed')),
 openedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), closedAt DATETIME2 NULL
);
CREATE UNIQUE INDEX IX_OneActiveSession ON dbo.DiningSessions(tableId) WHERE closedAt IS NULL;
CREATE TABLE dbo.Orders (
 id INT IDENTITY PRIMARY KEY, sessionId INT NOT NULL REFERENCES dbo.DiningSessions(id),
 userId INT NOT NULL REFERENCES dbo.Users(id), requestKey VARCHAR(80) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','served','cancelled')),
 note NVARCHAR(500) NOT NULL DEFAULT '', cancelReason NVARCHAR(300) NULL,
 createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UNIQUE(userId,requestKey)
);
CREATE TABLE dbo.OrderItems (
 id INT IDENTITY PRIMARY KEY, orderId INT NOT NULL REFERENCES dbo.Orders(id),
 dishId INT NOT NULL REFERENCES dbo.Dishes(id), dishName NVARCHAR(100) NOT NULL,
 quantity INT NOT NULL CHECK(quantity BETWEEN 1 AND 99), unitPrice INT NOT NULL CHECK(unitPrice > 0),
 UNIQUE(orderId,dishId)
);
CREATE TABLE dbo.Invoices (
 id INT IDENTITY PRIMARY KEY, sessionId INT NOT NULL UNIQUE REFERENCES dbo.DiningSessions(id),
 total INT NOT NULL CHECK(total >= 0), status VARCHAR(12) NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid')),
 method VARCHAR(20) NULL CHECK(method IN ('cash','transfer')), createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 paidAt DATETIME2 NULL, paidBy INT NULL REFERENCES dbo.Users(id)
);
END;

-- Công thức là dữ liệu riêng: xóa công thức không xóa món hoặc đơn đã bán.
IF OBJECT_ID('dbo.DishRecipes') IS NULL
BEGIN
CREATE TABLE dbo.DishRecipes (
 dishId INT PRIMARY KEY REFERENCES dbo.Dishes(id),
 ingredients NVARCHAR(4000) NOT NULL,
 instructions NVARCHAR(MAX) NOT NULL CHECK(LEN(instructions)<=8000),
 servings INT NOT NULL CHECK(servings BETWEEN 1 AND 20),
 prepMinutes INT NOT NULL CHECK(prepMinutes BETWEEN 1 AND 1440),
 updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
END;

