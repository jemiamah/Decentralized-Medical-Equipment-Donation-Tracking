import { describe, it, expect, beforeEach } from 'vitest';
import { mockClarityBitcoin, mockClaritySimnet } from './helpers/clarity-mock';

// Mock the Clarity environment
const simnet = mockClaritySimnet();
const donor = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
const certifier = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const nonAdmin = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
const equipmentId = 'VENTILATOR-2023-001';

describe('equipment-certification', () => {
	beforeEach(() => {
		// Reset the simnet before each test
		simnet.reset();
		
		// Add a certifier for testing
		simnet.callPublic('equipment-certification', 'add-certifier', [certifier]);
	});
	
	it('should allow admin to add a certifier', () => {
		const result = simnet.callPublic('equipment-certification', 'add-certifier', [nonAdmin]);
		expect(result.success).toBe(true);
	});
	
	it('should not allow non-admin to add a certifier', () => {
		const result = simnet.callPublic('equipment-certification', 'add-certifier', [nonAdmin], { sender: nonAdmin });
		expect(result.success).toBe(false);
		expect(result.error).toContain('u100'); // ERR-NOT-AUTHORIZED
	});
	
	it('should allow a certifier to certify equipment', () => {
		const expiryDate = 100000; // Some block height in the future
		const result = simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: certifier }
		);
		expect(result.success).toBe(true);
		
		// Check certification
		const cert = simnet.callReadOnly('equipment-certification', 'get-certification', [equipmentId, donor]);
		expect(cert.result).not.toBe(null);
		expect(cert.result.status).toBe('functional');
	});
	
	it('should not allow non-certifiers to certify equipment', () => {
		const expiryDate = 100000;
		const result = simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: nonAdmin }
		);
		expect(result.success).toBe(false);
		expect(result.error).toContain('u103'); // ERR-NOT-CERTIFIER
	});
	
	it('should not allow certifying already certified equipment', () => {
		const expiryDate = 100000;
		
		// First certification
		simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: certifier }
		);
		
		// Second attempt
		const result = simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: certifier }
		);
		
		expect(result.success).toBe(false);
		expect(result.error).toContain('u101'); // ERR-ALREADY-CERTIFIED
	});
	
	it('should allow updating certification', () => {
		const expiryDate = 100000;
		
		// First certification
		simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: certifier }
		);
		
		// Update certification
		const updateResult = simnet.callPublic(
			'equipment-certification',
			'update-certification',
			[equipmentId, donor, 'needs-repair', expiryDate],
			{ sender: certifier }
		);
		
		expect(updateResult.success).toBe(true);
		
		// Check updated certification
		const cert = simnet.callReadOnly('equipment-certification', 'get-certification', [equipmentId, donor]);
		expect(cert.result.status).toBe('needs-repair');
	});
	
	it('should allow admin to remove a certifier', () => {
		const result = simnet.callPublic('equipment-certification', 'remove-certifier', [certifier]);
		expect(result.success).toBe(true);
		
		// Certifier should no longer be able to certify
		const expiryDate = 100000;
		const certResult = simnet.callPublic(
			'equipment-certification',
			'certify-equipment',
			[equipmentId, donor, 'functional', expiryDate],
			{ sender: certifier }
		);
		
		expect(certResult.success).toBe(false);
		expect(certResult.error).toContain('u103'); // ERR-NOT-CERTIFIER
	});
});
