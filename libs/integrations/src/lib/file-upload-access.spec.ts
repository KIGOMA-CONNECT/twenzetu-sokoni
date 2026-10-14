import { canAccessUploadKey, isPublicUploadKey } from './file-upload.service';

describe('upload access control', () => {
  describe('isPublicUploadKey', () => {
    it('treats public asset folders as public', () => {
      expect(isPublicUploadKey('products/t1/abc.png')).toBe(true);
      expect(isPublicUploadKey('vendor-logos/t1/abc.png')).toBe(true);
      expect(isPublicUploadKey('avatars/t1/abc.png')).toBe(true);
      expect(isPublicUploadKey('general/abc.png')).toBe(true);
    });

    it('treats sensitive folders as non-public', () => {
      expect(isPublicUploadKey('kyc/t1/doc.pdf')).toBe(false);
      expect(isPublicUploadKey('unknown/abc.png')).toBe(false);
    });
  });

  describe('canAccessUploadKey', () => {
    it('allows anonymous access to public folders', () => {
      expect(canAccessUploadKey('products/t1/abc.png')).toBe(true);
      expect(canAccessUploadKey('products/t1/abc.png', null)).toBe(true);
    });

    it('denies anonymous access to sensitive folders', () => {
      expect(canAccessUploadKey('kyc/t1/doc.pdf')).toBe(false);
      expect(canAccessUploadKey('kyc/t1/doc.pdf', null)).toBe(false);
    });

    it('allows the owning tenant to read its own sensitive files', () => {
      expect(canAccessUploadKey('kyc/t1/doc.pdf', { tenantId: 't1', role: 'customer' })).toBe(true);
    });

    it('denies a different tenant (IDOR prevention)', () => {
      expect(canAccessUploadKey('kyc/t1/doc.pdf', { tenantId: 't2', role: 'customer' })).toBe(false);
    });

    it('allows admin roles to read cross-tenant sensitive files', () => {
      expect(canAccessUploadKey('kyc/t1/doc.pdf', { tenantId: 't9', role: 'admin' })).toBe(true);
      expect(canAccessUploadKey('kyc/t1/doc.pdf', { tenantId: 't9', role: 'compliance_admin' })).toBe(true);
    });
  });
});
