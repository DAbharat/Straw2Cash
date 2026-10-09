
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