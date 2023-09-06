# TileSide
A game about placing tiles to match up colors

The sides of each tile are made up of differently-colored segments. When segments of the same color from two different tiles touch, points are awarded.
Tiles cannot be placed such that differently-colored segments touch. Colored segments can touch blank segments, however.
Moving a tile and breaking a connection removes gained points. Therefore, the goal is to find the highest-scoring configuration of tiles.

Currently, the game does not have any "win state", "lose state", or "ending". Once the player can no longer make any moves, the game is effectively over.
Tiles are added from the "deck". Placing a tile from the deck finalizes that tile's existence, and there is no way to remove it from the board afterwards.

Sometimes, one tile can be "stacked" onto another. The colored, non-blank segments of the top tile override the segments of the bottom tile.
If this would cause differently-colored segments to touch each other on the resulting tile, they cannot be stacked.
Stacking is useful for creating high-scoring tiles by making as few of the segments blank as possible.

The custom mode allows the player to change various rules of the game, in order to create new experiences. Furthermore, the color scheme can be changed on the title screen.
