import Link from 'next/link';
import { ReactElement } from 'react';

import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <div>
      <header className={styles.header}>
        <Link href="/">
          <img src="/logo.svg" alt="logo" />
        </Link>
      </header>
    </div>
  );
}
