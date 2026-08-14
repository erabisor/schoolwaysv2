SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

USE schoolwaysv;
GO

IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'UQ_PushSubscriptions_Endpoint'
      AND parent_object_id = OBJECT_ID(N'dbo.PushSubscriptions')
)
BEGIN
    ALTER TABLE dbo.PushSubscriptions
    DROP CONSTRAINT UQ_PushSubscriptions_Endpoint;
END;
GO

IF COL_LENGTH('dbo.PushSubscriptions', 'EndpointHash') IS NULL
BEGIN
    ALTER TABLE dbo.PushSubscriptions
    ADD EndpointHash AS
        CONVERT(BINARY(32), HASHBYTES('SHA2_256', Endpoint))
        PERSISTED;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_PushSubscriptions_EndpointHash'
      AND object_id = OBJECT_ID(N'dbo.PushSubscriptions')
)
BEGIN
    CREATE UNIQUE INDEX UX_PushSubscriptions_EndpointHash
    ON dbo.PushSubscriptions (EndpointHash);
END;
GO