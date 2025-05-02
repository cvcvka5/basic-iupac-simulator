// Import Konva
import Konva from 'konva';

// Grid setup
const gridSize = 80;
const stage = new Konva.Stage({
  container: 'organicGrid',
  width: window.innerWidth,
  height: window.innerHeight,
});

// Style the container
const container = document.getElementById('organicGrid');
container.style.backgroundColor = '#111';
container.style.border = '2px solid #444';
container.style.position = 'relative';

// Add a button to add new atoms
const button = document.createElement('button');
button.innerText = 'Add CH₄ Molecule';
button.style.position = 'absolute';
button.style.top = '10px';
button.style.right = '10px';
button.style.zIndex = '10';
button.style.padding = '10px';
button.style.backgroundColor = '#333';
button.style.color = 'white';
button.style.border = '1px solid #555';
button.style.cursor = 'pointer';
container.appendChild(button);

button.addEventListener('click', () => {
  const x = Math.random() * (stage.width() - 100) + 50;
  const y = Math.random() * (stage.height() - 100) + 50;
  addAtom(x, y);
});

// Background grid
const background = new Konva.Layer();
for (let i = 0; i < stage.width(); i += gridSize) {
  background.add(
    new Konva.Line({ points: [i, 0, i, stage.height()], stroke: '#333' })
  );
}
for (let i = 0; i < stage.height(); i += gridSize) {
  background.add(
    new Konva.Line({ points: [0, i, stage.width(), i], stroke: '#333' })
  );
}
stage.add(background);

const atoms = new Konva.Layer();
stage.add(atoms);

// CH4Atom Class
class CH4Atom {
  constructor(id, group, textNode) {
    this.id = id;
    this.group = group;
    this.textNode = textNode;
    this.bonds = new Set();
    this.maxHydrogens = 4;
  }

  addBond(otherAtom) {
    const bondId = [this.id, otherAtom.id].sort().join('-');
    if (!this.bonds.has(bondId)) {
      if (this.bonds.size < this.maxHydrogens && otherAtom.bonds.size < otherAtom.maxHydrogens) {
        this.bonds.add(bondId);
        otherAtom.bonds.add(bondId);
        drawBond(this, otherAtom);
        this.updateHydrogenDisplay();
        otherAtom.updateHydrogenDisplay();
      }
    }
  }

  removeBond(otherAtom) {
    const bondId = [this.id, otherAtom.id].sort().join('-');
    if (this.bonds.has(bondId)) {
      this.bonds.delete(bondId);
      otherAtom.bonds.delete(bondId);
      removeBondLine(bondId);
      this.updateHydrogenDisplay();
      otherAtom.updateHydrogenDisplay();
    }
  }

  updateHydrogenDisplay() {
    const remaining = this.maxHydrogens - this.bonds.size;
    this.textNode.text(`CH${remaining}`);
  }
}

const alkaneNames = {
  1: 'methane',
  2: 'ethane',
  3: 'propane',
  4: 'butane',
  5: 'pentane',
  6: 'hexane',
  7: 'heptane',
  8: 'octane',
  9: 'nonane',
  10: 'decane',
};

function buildGraph(atoms) {
  const graph = {};
  for (const atom of atoms) {
    graph[atom.id] = [];
    for (const bondId of atom.bonds) {
      const parts = bondId.split('-');
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
  if (atoms.length === 0) return '';

  const graph = buildGraph(atoms);
  let bestChain = [];

  for (const atom of atoms) {
    const path = dfsLongestChain(graph, atom.id);
    if (path.length > bestChain.length) bestChain = path;
  }

  const mainChainLength = bestChain.length;
  const baseName = alkaneNames[mainChainLength] || `${mainChainLength}-carbon alkane`;

  const branches = [];
  const mainChainSet = new Set(bestChain);
  for (const atom of atoms) {
    if (!mainChainSet.has(atom.id) && atom.bonds.size > 0) {
      for (const bondId of atom.bonds) {
        const connectedId = bondId.split('-').find(id => id !== atom.id);
        const index = bestChain.indexOf(connectedId);
        if (index !== -1) {
          branches.push(index + 1);
        }
      }
    }
  }

  if (branches.length > 0) {
    const branchName = branches.map(n => `${n}-methyl`).sort().join(', ');
    return `${branchName} ${baseName}`;
  } else {
    return baseName;
  }
}

// Label layer for name display
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

let atomList = [];
let idCounter = 0;
const bondLines = {}; // Map bondId to Konva.Line

function drawBond(atom1, atom2) {
  const pos1 = atom1.group.getPosition();
  const pos2 = atom2.group.getPosition();
  const bondId = [atom1.id, atom2.id].sort().join('-');

  if (bondLines[bondId]) return;

  const line = new Konva.Line({
    points: [pos1.x, pos1.y, pos2.x, pos2.y],
    stroke: '#66ccff',
    strokeWidth: 2,
  });

  atoms.add(line);
  bondLines[bondId] = line;
  atoms.draw();
}

function removeBondLine(bondId) {
  const line = bondLines[bondId];
  if (line) {
    line.destroy();
    delete bondLines[bondId];
    atoms.draw();
  }
}

function addAtom(x, y) {
  const group = new Konva.Group({ x, y, draggable: true });
  const atom = new Konva.Text({
    text: 'CH4',
    fontSize: 20,
    fontFamily: 'monospace',
    align: 'center',
    verticalAlign: 'middle',
    fill: '#99ffcc',
    shadowColor: '#0ff',
    shadowBlur: 10,
  });

  atom.offsetX(atom.getWidth() / 2);
  atom.offsetY(atom.getHeight() / 2);

  group.add(atom);
  atoms.add(group);
  atoms.draw();

  const newX = Math.round(group.x() / gridSize) * gridSize;
  const newY = Math.round(group.y() / gridSize) * gridSize;
  group.position({ x: newX, y: newY });

  const ch4 = new CH4Atom(`A${idCounter++}`, group, atom);

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
      } else {
        ch4.removeBond(other);
      }
    }

    showIUPACName();
  });

  atomList.push(ch4);
}

// Sample atoms
addAtom(100, 100);
addAtom(180, 100);
addAtom(180, 180);
addAtom(260, 100);
