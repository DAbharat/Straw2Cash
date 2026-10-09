
permit (
    principal,
    action == Action::"ReadProfile",
    resource
)
when {
    resource.owner == principal
};

permit (
    principal,
    action == Action::"UpdateProfile",
    resource
)
when {
    resource.owner == principal
};

permit (
    principal,
    action == Action::"CreateListing",
    resource
)
when {
    principal.role == "FARMER"
};

permit (
    principal,
    action == Action::"ManageListing",
    resource
)
when {
    principal.role == "FARMER" &&
    resource.owner == principal
};

permit (
    principal,
    action == Action::"CreateRequirement",
    resource
)
when {
    principal.role == "BUYER"
};

permit (
    principal,
    action == Action::"ManageRequirement",
    resource
)
when {
    principal.role == "BUYER" &&
    resource.owner == principal
};

permit (
    principal,
    action == Action::"CreateMatch",
    resource
)
when {
    principal.role == "FARMER" || principal.role == "BUYER"
};

permit (
    principal,
    action == Action::"ManageMatch",
    resource
)
when {
    resource.listingOwner == principal || resource.reqOwner == principal
};