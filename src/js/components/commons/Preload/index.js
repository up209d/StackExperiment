import React from 'react';
import styled from 'styled-components';

const StyledPreload = styled.a`
  text-align: center;
  display: block;
  pointer-events: none;
  padding: 10px;
`;

const Preload = () => (
  <StyledPreload href={'javascript:void(0)'} class={'dl-preload'}>
    <img src={require('assets/images/loading.gif?File')} alt={'Loading...'}/>
  </StyledPreload>
);

export default Preload;
