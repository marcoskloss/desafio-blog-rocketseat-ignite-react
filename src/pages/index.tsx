import { ReactElement, useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [pages, setPages] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);

  async function handleLoadPosts(): Promise<void> {
    const response = await fetch(postsPagination.next_page);
    const data: ApiSearchResponse = await response.json();
    setNextPage(data.next_page);
    setPages(prevState => {
      const newPosts: Post[] = data.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            author: post.data.author,
            title: post.data.title,
            subtitle: post.data.subtitle,
          },
        };
      });

      return [...prevState, ...newPosts];
    });
  }

  useEffect(() => {
    setPages(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination]);

  return (
    <div className={commonStyles.container}>
      <Header />

      <div>
        {pages.map(post => (
          <div key={post.uid} className={styles.postCard}>
            <header>
              <Link href={`/post/${post.uid}`}>
                <h2>{post.data.title}</h2>
              </Link>
            </header>
            <p>{post.data.subtitle}</p>
            <div className={styles.postInfo}>
              <span className={styles.date}>
                <FiCalendar className={styles.icon} />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span className={styles.author}>
                <FiUser className={styles.icon} />
                {post.data.author}
              </span>
            </div>
          </div>
        ))}
      </div>

      {nextPage && (
        <div>
          <button
            type="button"
            className={styles.loadPosts}
            onClick={handleLoadPosts}
          >
            Carregar mais posts
          </button>
        </div>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 2,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        author: post.data.author,
        title: post.data.title,
        subtitle: post.data.subtitle,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 60, // 1 hour
  };
};
