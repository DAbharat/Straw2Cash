package authz

import (
	"embed"
	"fmt"

	cedar "github.com/cedar-policy/cedar-go"
	"github.com/cedar-policy/cedar-go/types"
)

//go:embed policies/profile.cedar
var policyFS embed.FS

type Authorizer struct {
	policies *cedar.PolicySet
}

func NewAuthorizer() (*Authorizer, error) {
	policyBytes, err := policyFS.ReadFile("policies/profile.cedar")
	if err != nil {
		return nil, fmt.Errorf("read cedar policies: %w", err)
	}

	policies, err := cedar.NewPolicySetFromBytes("profile.cedar", policyBytes)
	if err != nil {
		return nil, fmt.Errorf("parse cedar policies: %w", err)
	}

	return &Authorizer{
		policies: policies,
	}, nil
}

func (a *Authorizer) IsAuthorized(principal, action, resource cedar.EntityUID, entities types.EntityMap) (bool, error) {
	request := cedar.Request{
		Principal: principal,
		Action:    action,
		Resource:  resource,
		Context:   cedar.NewRecord(nil),
	}

	decision, diagnostic := cedar.Authorize(
		a.policies,
		entities,
		request,
	)

	if len(diagnostic.Errors) > 0 {
		return false, fmt.Errorf("authorization error: %v", diagnostic.Errors[0])
	}

	return decision == cedar.Allow, nil
}

func MergeEntities(maps ...types.EntityMap) types.EntityMap {
	result := types.EntityMap{}
	for _, m := range maps {
		for k, v := range m {
			if existing, ok := result[k]; ok {
				// If existing has attributes and new one has nil/empty, skip overwrite
				if len(existing.Attributes.Map()) > 0 && len(v.Attributes.Map()) == 0 {
					continue
				}
			}
			result[k] = v
		}
	}
	return result
}

func BuildUserEntity(userID, role string) (cedar.EntityUID, types.EntityMap) {
	uid := cedar.NewEntityUID("User", cedar.String(userID))
	entities := types.EntityMap{
		uid: {
			UID:     uid,
			Parents: cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(types.RecordMap{
				"role": cedar.String(role),
			}),
			Tags: cedar.NewRecord(nil),
		},
	}
	return uid, entities
}

func BuildProfileEntity(profileID, ownerUserID string) (cedar.EntityUID, types.EntityMap) {
	uid := cedar.NewEntityUID("Profile", cedar.String(profileID))
	ownerUID := cedar.NewEntityUID("User", cedar.String(ownerUserID))

	entities := types.EntityMap{
		uid: {
			UID:     uid,
			Parents: cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(types.RecordMap{
				"owner": ownerUID,
			}),
			Tags: cedar.NewRecord(nil),
		},
		ownerUID: {
			UID:        ownerUID,
			Parents:    cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(nil),
			Tags:       cedar.NewRecord(nil),
		},
	}
	return uid, entities
}

func BuildListingEntity(listingID, ownerUserID string) (cedar.EntityUID, types.EntityMap) {
	uid := cedar.NewEntityUID("Listing", cedar.String(listingID))
	ownerUID := cedar.NewEntityUID("User", cedar.String(ownerUserID))

	entities := types.EntityMap{
		uid: {
			UID:     uid,
			Parents: cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(types.RecordMap{
				"owner": ownerUID,
			}),
			Tags: cedar.NewRecord(nil),
		},
		ownerUID: {
			UID:        ownerUID,
			Parents:    cedar.NewEntityUIDSet(),
			Attributes: cedar.NewRecord(nil),
			Tags:       cedar.NewRecord(nil),
		},
	}
	return uid, entities
}

func ActionReadProfile() cedar.EntityUID {
	return cedar.NewEntityUID("Action", cedar.String("ReadProfile"))
}

func ActionUpdateProfile() cedar.EntityUID {
	return cedar.NewEntityUID("Action", cedar.String("UpdateProfile"))
}

func ActionCreateListing() cedar.EntityUID {
	return cedar.NewEntityUID("Action", cedar.String("CreateListing"))
}

func ActionManageListing() cedar.EntityUID {
	return cedar.NewEntityUID("Action", cedar.String("ManageListing"))
}
