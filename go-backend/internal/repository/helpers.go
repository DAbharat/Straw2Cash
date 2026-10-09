package repository

import (
	"fmt"
	"github.com/jackc/pgx/v5/pgtype"
)

// toPgNumeric converts a float64 to pgtype.Numeric
func toPgNumeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	err := n.Scan(fmt.Sprintf("%f", f))
	if err != nil {
		n.Valid = false
	}
	return n
}

// toPgText converts a string to pgtype.Text
func toPgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}

// parseUUID converts a string to pgtype.UUID
func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}
