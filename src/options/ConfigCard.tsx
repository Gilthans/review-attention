import { JSX } from 'react';

export function ConfigCard(props: {
  title: string;
  children: JSX.Element;
}): JSX.Element {
  return (
    <div className='card mb-4 max-w-md bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title mb-4'>{props.title}</h2>
        {props.children}
      </div>
    </div>
  );
}
