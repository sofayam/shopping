# Refined Requirements on the basis of initial implementation

## Shopping List

If the filter is set to a particular shop, the list should show all items which have been previously chosen and could be bought from that shop.

If there is no filter set (All shops) then the list should be constructed such that a minimum number of shops are visited to get all the chosen items. If there are several alternatives for an item, then one shop should be chosen as the default.

# *NEW* Shop types

A shop type e.g. supermarket, is associated with various product types(e.g. dairy, dry goods etc) that it sells. There should be an interace to create and edit these types

# *NEW* Shops

Every Shop has a shop type. Products in the catalog which have an empty Shops field can be bought from any shop selling products of that type. There should be an interface to create and edit Shops and their types.

