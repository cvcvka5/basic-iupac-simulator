// --- CH4Atom Class ---
class CH4Atom {
    constructor(id, group) {
      this.id = id;
      this.group = group;
      this.bonds = new Set();
    }
  
    addBond(otherAtom) {
      const bondId = [this.id, otherAtom.id].sort().join("-");
      this.bonds.add(bondId);
    }
  
    removeBond(otherAtom) {
      const bondId = [this.id, otherAtom.id].sort().join("-");
      this.bonds.delete(bondId);
    }
  }
  
  const alkaneNames = {
    1: "methane",
    2: "ethane",
    3: "propane",
    4: "butane",
    5: "pentane",
    6: "hexane",
    7: "heptane",
    8: "octane",
    9: "nonane",
    10: "decane",
  };
  
  function buildGraph(atoms) {
    const graph = {};
    for (const atom of atoms) {
      graph[atom.id] = [];
      for (const bondId of atom.bonds) {
        const parts = bondId.split("-");
        const otherId = parts[0] === atom.id ? parts[1] : parts[0];
        graph[atom.id].push(otherId);
      }
    }
    return graph;
  }
  
  function dfsLongestChain(graph, start, visited = new Set()) {
    visited.add(start);
    let longest = [start];
  
    for (const neighbor of graph[start] || []) {
      if (!visited.has(neighbor)) {
        const path = dfsLongestChain(graph, neighbor, new Set(visited));
        if (path.length + 1 > longest.length) {
          longest = [start, ...path];
        }
      }
    }
  
    return longest;
  }
  
  function getIUPACName(atoms) {
    if (atoms.length === 0) return "";
  
    const graph = buildGraph(atoms);
    let bestChain = [];
  
    for (const atom of atoms) {
      const path = dfsLongestChain(graph, atom.id);
      if (path.length > bestChain.length) bestChain = path;
    }
  
    const mainChainLength = bestChain.length;
    const baseName = alkaneNames[mainChainLength] || `${mainChainLength}-carbon alkane`;
    return baseName;
  }
  
  // Reuse this layer
  const nameLayer = new Konva.Layer();
  stage.add(nameLayer);
  
  function showIUPACName() {
    const name = getIUPACName(atomList);
  
    nameLayer.destroyChildren();
  
    const nameText = new Konva.Text({
      text: `IUPAC Name: ${name}`,
      x: 20,
      y: 20,
      fontSize: 24,
      fill: 'white',
      fontFamily: 'monospace',
    });
  
    nameLayer.add(nameText);
    nameLayer.draw();
  }
  
  // Example atom creation logic
  let idCounter = 0;
  function addAtom(x, y, symbol) {
    const group = new Konva.Group({ x, y, draggable: true });
    const atom = new Konva.Text({
      text: symbol,
      fontSize: 20,
      fontFamily: 'monospace',
      align: 'center',
      verticalAlign: 'middle',
      fill: '#fefefe',
    });
  
    atom.offsetX(atom.getWidth() / 2);
    atom.offsetY(atom.getHeight() / 2);
  
    group.add(atom);
    atoms.add(group);
    atoms.draw();
  
    const newX = Math.round(group.x() / gridSize) * gridSize;
    const newY = Math.round(group.y() / gridSize) * gridSize;
    group.position({ x: newX, y: newY });
  
    const ch4 = new CH4Atom(`A${idCounter++}`, group);
  
    group.on('dragend', () => {
      const snappedX = Math.round(group.x() / gridSize) * gridSize;
      const snappedY = Math.round(group.y() / gridSize) * gridSize;
      group.position({ x: snappedX, y: snappedY });
  
      for (const other of atomList) {
        if (other === ch4) continue;
  
        const pos1 = group.getPosition();
        const pos2 = other.group.getPosition();
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
  
        if ((dx === gridSize && dy === 0) || (dy === gridSize && dx === 0)) {
          ch4.addBond(other);
          other.addBond(ch4);
        } else {
          ch4.removeBond(other);
          other.removeBond(ch4);
        }
      }
  
      showIUPACName();
    });
  
    atomList.push(ch4);
  }
  
  // Add test atoms
  addAtom(100, 100, "CH4");
  addAtom(180, 100, "CH4");
  addAtom(260, 100, "CH4");