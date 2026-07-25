import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryConfigs1700000000001 implements MigrationInterface {
  name = 'AddCountryConfigs1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "country_configs" ("country_code", "country_name", "currency", "currency_symbol", "timezone", "telecoms", "tax_config", "supported_payment_methods")
      VALUES
        ('NG', 'Nigeria', 'NGN', '₦', 'Africa/Lagos', '[{"name":"MTN","apiType":"mtn-momo"},{"name":"Airtel","apiType":"airtel-money"}]', '{"vatRate":7.5,"withholdingTaxRate":10}', '["mobile_money","card","bank_transfer","cash"]'),
        ('KE', 'Kenya', 'KES', 'KSh', 'Africa/Nairobi', '[{"name":"Safaricom","apiType":"m-pesa"},{"name":"Airtel","apiType":"airtel-money"}]', '{"vatRate":16,"withholdingTaxRate":5}', '["mobile_money","card","bank_transfer","cash"]'),
        ('GH', 'Ghana', 'GHS', 'GH₵', 'Africa/Accra', '[{"name":"MTN","apiType":"mtn-momo"},{"name":"Vodafone","apiType":"vodafone-cash"},{"name":"AirtelTigo","apiType":"airteltigo-money"}]', '{"vatRate":15,"withholdingTaxRate":8}', '["mobile_money","card","bank_transfer","cash"]')
      ON CONFLICT ("country_code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "country_configs" WHERE "country_code" IN ('NG', 'KE', 'GH')`);
  }
}
