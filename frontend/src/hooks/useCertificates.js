import { useContext } from 'react';
import { CertificateContext } from '../context/contexts';

export function useCertificates() {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificates must be used within a CertificateProvider');
  }
  return context;
}
