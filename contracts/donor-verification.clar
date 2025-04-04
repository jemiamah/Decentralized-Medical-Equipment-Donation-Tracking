;; donor-verification.clar
;; This contract validates legitimate sources of medical equipment

(define-data-var admin principal tx-sender)

;; Map to store verified donors
(define-map verified-donors principal bool)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-VERIFIED (err u101))
(define-constant ERR-NOT-FOUND (err u102))

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Add a new verified donor
(define-public (add-verified-donor (donor principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? verified-donors donor)) ERR-ALREADY-VERIFIED)
    (ok (map-set verified-donors donor true))))

;; Remove a verified donor
(define-public (remove-verified-donor (donor principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? verified-donors donor)) ERR-NOT-FOUND)
    (ok (map-delete verified-donors donor))))

;; Check if a donor is verified
(define-read-only (is-verified-donor (donor principal))
  (default-to false (map-get? verified-donors donor)))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))))
