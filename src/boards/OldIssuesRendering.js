import React from 'react';

import './OldIssues.css';

export default function({ data }) {
  return <ul className="dashboard-lines">{data.map(renderElement)}</ul>;
}

function renderElement({ title, number, link, days }) {
  let howOld;
  switch (true) {
    case days < 5:
      howOld = 'fresh';
      break;
    case days < 30:
      howOld = 'aged';
      break;
    default:
      howOld = 'rotten';
      break;
  }
  const badgeCssClass = `last-updated ${howOld}`;
  return (
    <li className="dashboard-line" key={title}>
      <span>{number}</span>
      <a href={link} className="title">
        {title}
      </a>
      <span className={badgeCssClass}>{days}</span>
    </li>
  );
}
