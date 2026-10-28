-- Run against the application's configured database. Existing pictures remain intact.
IF COL_LENGTH('dbo.Dishes', 'imageUrl') IS NULL
    ALTER TABLE dbo.Dishes ADD imageUrl NVARCHAR(2048) NULL;
