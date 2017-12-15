import React, { Component } from 'react';
import { Sigma } from 'react-sigma';
import CustomSigma from './CustomSigma';
import { generateGraph, scanTriangulate, delaunayTriangulate } from './delaunay';
import exampleGraph from './delaunay/exampleGraph';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: 10,
      scale: 100,
      url: '',
      graph: generateGraph(10, 100)
    };
  }

  setNumNodes({ target: { value } }) {
    this.setState({ nodes: value });
  }

  setScale({ target: { value } }) {
    this.setState({ scale: value });
  }

  handleURLChange({ target: { value } }) {
    this.setState({ url: value });
  }

  loadRandom() {
    this.setState({
      graph: generateGraph(this.state.nodes, this.state.scale)
    });
  }

  loadExample() {
    this.setState({ graph: exampleGraph });
  }

  clearEdges() {
    this.setState({ graph: { nodes: this.state.graph.nodes, edges: [] } });
  }

  loadURL() {
    fetch(this.state.url).then(response => {
      if (response.status === 200) {
        response.json().then(json => {
          console.log(json);
          this.setState({ graph: json });
        });
      }
    });
  }

  triangulate() {
    this.setState({
      graph: scanTriangulate({ nodes: this.state.graph.nodes, edges: [] })
    });
  }

  delaunay() {
    this.setState({
      graph: delaunayTriangulate(this.state.graph)
    });
  }

  render() {
    return (
      <div>
        <Sigma
          style={{ width:"100vw", height:"90vh" }}
          graph={this.state.graph}
          settings={{
            maxEdgeSize: 5,
            edgeColor: "default",
            defaultNodeColor: "#34495E",
            defaultEdgeColor: "#58D68D",
            drawLabels: false,
          }}
        >
          <CustomSigma graph={this.state.graph} />
        </Sigma>
        <div className="toolbar" style={{ width: "100vw", height: "10vh" }}>
          <button onClick={() => this.loadExample()}>
            Load Sample Graph
          </button>
          <div className="random-load">
            <div className="num-nodes">
              <label>Nodes</label>
              <input type="number" value={this.state.nodes} onChange={e => this.setNumNodes(e)} />
            </div>
            <div className="scale">
              <label>Scale</label>
              <input type="number" value={this.state.scale} onChange={e => this.setScale(e)} />
            </div>
            <button onClick={() => this.loadRandom()}>
              Load Random Graph
            </button>
          </div>
          <div className="url-load">
            <input type="text" value={this.state.url} onChange={e => this.handleURLChange(e)} />
            <button onClick={() => this.loadURL()}>
              Load Graph From URL
            </button>
          </div>
          <div className="triangulate">
            <button onClick={() => this.clearEdges()}>
              Clear Edges
            </button>
            <button onClick={() => this.triangulate()}>
              Scan Triangulate
            </button>
            <button onClick={() => this.delaunay()}>
              Delaunay Triangulate
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
