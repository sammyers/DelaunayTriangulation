import React from 'react';

export default class CustomSigma extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidUpdate() {
    this.props.sigma.graph.clear();
    this.props.sigma.graph.read(this.props.graph);
    this.props.sigma.refresh();
  }

  render() {
    return null;
  }
}
