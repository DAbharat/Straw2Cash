package authz

import (
	"testing"

	cedar "github.com/cedar-policy/cedar-go"
	"github.com/cedar-policy/cedar-go/types"
)

func TestAuthorizer_ReadProfile(t *testing.T) {
	authorizer, err := NewAuthorizer()
	if err != nil {
		t.Fatalf("failed to create authorizer: %v", err)
	}

	tests := []struct {
		name      string
		principal string
		owner     string
		resource  string
		want      bool
		wantErr   bool
	}{
		{
			name:      "Allowed to read own profile",
			principal: "user-1",
			owner:     "user-1",
			resource:  "profile-1",
			want:      true,
		},
		{
			name:      "Denied to read other profile",
			principal: "user-2",
			owner:     "user-1",
			resource:  "profile-1",
			want:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pUID, pEnt := BuildUserEntity(tt.principal, "FARMER")
			rUID, rEnt := BuildProfileEntity(tt.resource, tt.owner)
			action := ActionReadProfile()

			entities := MergeEntities(pEnt, rEnt)
			got, err := authorizer.IsAuthorized(pUID, action, rUID, entities)

			if (err != nil) != tt.wantErr {
				t.Errorf("IsAuthorized() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("IsAuthorized() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAuthorizer_CreateListing(t *testing.T) {
	authorizer, err := NewAuthorizer()
	if err != nil {
		t.Fatalf("failed to create authorizer: %v", err)
	}

	tests := []struct {
		name      string
		principal string
		role      string
		want      bool
	}{
		{
			name:      "Farmer can create listing",
			principal: "user-1",
			role:      "FARMER",
			want:      true,
		},
		{
			name:      "Buyer cannot create listing",
			principal: "user-2",
			role:      "BUYER",
			want:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pUID, pEnt := BuildUserEntity(tt.principal, tt.role)
			// For create listing, the resource can just be a dummy listing (doesn't exist yet, but we need an entity UID)
			rUID, rEnt := BuildListingEntity("dummy", tt.principal)
			action := ActionCreateListing()

			entities := MergeEntities(pEnt, rEnt)
			got, err := authorizer.IsAuthorized(pUID, action, rUID, entities)

			if err != nil {
				t.Errorf("IsAuthorized() unexpected error = %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("IsAuthorized() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAuthorizer_ManageListing(t *testing.T) {
	authorizer, err := NewAuthorizer()
	if err != nil {
		t.Fatalf("failed to create authorizer: %v", err)
	}

	pUID, pEnt := BuildUserEntity("user-1", "FARMER")
	rUID, rEnt := BuildListingEntity("listing-1", "user-1") // owner is user-1
	action := ActionManageListing()

	entities := MergeEntities(pEnt, rEnt)
	got, err := authorizer.IsAuthorized(pUID, action, rUID, entities)

	if err != nil {
		t.Errorf("IsAuthorized() unexpected error = %v", err)
	}
	if !got {
		t.Errorf("expected farmer to be able to manage own listing")
	}

	// Try managing someone else's listing
	pUID2, pEnt2 := BuildUserEntity("user-2", "FARMER")
	entities2 := MergeEntities(pEnt2, rEnt) // same resource, owned by user-1
	got2, err := authorizer.IsAuthorized(pUID2, action, rUID, entities2)

	if err != nil {
		t.Errorf("IsAuthorized() unexpected error = %v", err)
	}
	if got2 {
		t.Errorf("expected farmer to be denied managing other listing")
	}
}

func TestAuthorizer_InvalidPolicy(t *testing.T) {
	_, err := cedar.NewPolicySetFromBytes("invalid.cedar", []byte("invalid syntax"))
	if err == nil {
		t.Errorf("expected error when parsing invalid policy")
	}
}

func TestAuthorizer_EvaluationError(t *testing.T) {
	authorizer, err := NewAuthorizer()
	if err != nil {
		t.Fatalf("failed to create authorizer: %v", err)
	}

	// Pass incorrect types to cause evaluation error
	pUID := cedar.NewEntityUID("UnknownPrincipal", cedar.String("test"))
	rUID := cedar.NewEntityUID("UnknownResource", cedar.String("test"))
	action := ActionReadProfile()

	entities := types.EntityMap{
		pUID: {
			UID:        pUID,
			Parents:    cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(nil),
			Tags:       cedar.NewRecord(nil),
		},
		rUID: {
			UID:        rUID,
			Parents:    cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(nil),
			Tags:       cedar.NewRecord(nil),
		},
	}

	_, err = authorizer.IsAuthorized(pUID, action, rUID, entities)
	if err == nil {
		t.Errorf("expected evaluation error due to missing required attributes or types, but got nil")
	}
}
