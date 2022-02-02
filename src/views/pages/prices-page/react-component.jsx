import React from 'react';
import reactWrapper from './reactWrapper';
import './react-component.scss';

const HelloReact = () => <div className="container">HELLO REACT</div>;

export default reactWrapper(HelloReact);
