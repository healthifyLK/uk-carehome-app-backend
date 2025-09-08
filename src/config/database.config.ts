// Database Configuration
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'carehome_db',
    autoLoadModels: true,
    synchronize: process.env.NODE_ENV === 'development',
    logging: false, // Fix deprecation warning
    define: {
      timestamps: true,
      paranoid: true, // Soft deletes for GDPR compliance
      underscored: true,
    },
  }));