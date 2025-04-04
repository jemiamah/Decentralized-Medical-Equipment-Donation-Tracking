;; equipment-certification.clar
;; This contract confirms functionality and safety of medical equipment

(define-data-var admin principal tx-sender)

;; Equipment certification status
(define-map equipment-certifications
  { equipment-id: (string-ascii 64), donor: principal }
  {
    status: (string-ascii 20),
    certification-date: uint,
    expiry-date: uint,
    certifier: principal
  }
)

;; Map of authorized certifiers
(define-map authorized-certifiers principal bool)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-CERTIFIED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-NOT-CERTIFIER (err u103))

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Check if caller is an authorized certifier
(define-private (is-certifier)
  (default-to false (map-get? authorized-certifiers tx-sender)))

;; Add a certifier
(define-public (add-certifier (certifier principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (ok (map-set authorized-certifiers certifier true))))

;; Remove a certifier
(define-public (remove-certifier (certifier principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (ok (map-delete authorized-certifiers certifier))))

;; Certify equipment
(define-public (certify-equipment
  (equipment-id (string-ascii 64))
  (donor principal)
  (status (string-ascii 20))
  (expiry-date uint))
  (begin
    (asserts! (is-certifier) ERR-NOT-CERTIFIER)
    (asserts! (is-none (map-get? equipment-certifications { equipment-id: equipment-id, donor: donor })) ERR-ALREADY-CERTIFIED)
    (ok (map-set equipment-certifications
      { equipment-id: equipment-id, donor: donor }
      {
        status: status,
        certification-date: block-height,
        expiry-date: expiry-date,
        certifier: tx-sender
      }))))

;; Get equipment certification details
(define-read-only (get-certification
  (equipment-id (string-ascii 64))
  (donor principal))
  (map-get? equipment-certifications { equipment-id: equipment-id, donor: donor }))

;; Update equipment certification
(define-public (update-certification
  (equipment-id (string-ascii 64))
  (donor principal)
  (status (string-ascii 20))
  (expiry-date uint))
  (begin
    (asserts! (is-certifier) ERR-NOT-CERTIFIER)
    (asserts! (is-some (map-get? equipment-certifications { equipment-id: equipment-id, donor: donor })) ERR-NOT-FOUND)
    (ok (map-set equipment-certifications
      { equipment-id: equipment-id, donor: donor }
      {
        status: status,
        certification-date: block-height,
        expiry-date: expiry-date,
        certifier: tx-sender
      }))))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))))
