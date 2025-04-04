import { describe, it, expect, beforeEach } from 'vitest';
import { mockClarityBitcoin, mockClaritySimnet } from './helpers/clarity-mock';

// Mock the Clarity environment
const simnet = mockClaritySimnet();
const donor1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
const donor2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const nonAdmin = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';

describe('donor-verification', () => {
  beforeEach(() => {
    // Reset the simnet before each test
    simnet.reset();
  });
  
  it('should allow admin to add a verified donor', () => {
    const result = simnet.callPublic('donor-verification', 'add-verified-donor', [donor1]);
    expect(result.success).toBe(true);
    
    const isVerified = simnet.callReadOnly('donor-verification', 'is-verified-donor', [donor1]);
    expect(isVerified.result).toBe(true);
  });
  
  it('should not allow non-admin to add a verified donor', () => {
    const result = simnet.callPublic('donor-verification', 'add-verified-donor', [donor1], { sender: nonAdmin });
    expect(result.success).toBe(false);
    expect(result.error).toContain('u100'); // ERR-NOT-AUTHORIZED
  });
  
  it('should not allow adding a donor that is already verified', () => {
    // First add the donor
    simnet.callPublic('donor-verification', 'add-verified-donor', [donor1]);
    
    // Try to add again
    const result = simnet.callPublic('donor-verification', 'add-verified-donor', [donor1]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('u101'); // ERR-ALREADY-VERIFIED
  });
  
  it('should allow admin to remove a verified donor', () => {
    // First add the donor
    simnet.callPublic('donor-verification', 'add-verified-donor', [donor1]);
    
    // Then remove
    const result = simnet.callPublic('donor-verification', 'remove-verified-donor', [donor1]);
    expect(result.success).toBe(true);
    
    // Check if removed
    const isVerified = simnet.callReadOnly('donor-verification', 'is-verified-donor', [donor1]);
    expect(isVerified.result).toBe(false);
  });
  
  it('should not allow removing a donor that is not verified', () => {
    const result = simnet.callPublic('donor-verification', 'remove-verified-donor', [donor1]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('u102'); // ERR-NOT-FOUND
  });
  
  it('should allow admin to transfer admin rights', () => {
    const result = simnet.callPublic('donor-verification', 'transfer-admin', [nonAdmin]);
    expect(result.success).toBe(true);
    
    // New admin should be able to add donors
    const addResult = simnet.callPublic('donor-verification', 'add-verified-donor', [donor1], { sender: nonAdmin });
    expect(addResult.success).toBe(true);
  });
});
