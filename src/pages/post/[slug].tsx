import { GetStaticPaths, GetStaticProps } from 'next';
import { ReactElement } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
        type: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  function calculateReadTime(): number {
    const readTime = post.data.content.reduce((sumTotal, content) => {
      const textTime = RichText.asText(content.body).split(/\s* \s*/).length;
      return Math.ceil(sumTotal + textTime / 200);
    }, 0);

    return readTime;
  }

  if (router.isFallback) {
    return (
      <div className={styles.loading}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <img
        src={post.data.banner.url}
        alt={post.data.title}
        className={styles.banner}
      />
      <div className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <span>
              <FiCalendar className={styles.icon} />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser className={styles.icon} />
              {post.data.author}
            </span>
            <span>
              <FiClock className={styles.icon} />
              {calculateReadTime()} min
            </span>
          </div>

          <div className={styles.postContent}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h3>{content.heading}</h3>
                <div className={styles.text}>
                  {content.body.map((body, index) => {
                    const key = index;

                    return body.type === 'list-item' ? (
                      <ul key={key}>
                        <li>{body.text}</li>
                      </ul>
                    ) : (
                      <p key={key}>{body.text}</p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 2 }
  );

  const slugs = posts.results.map(post => post.uid);
  const paths = slugs.map(slug => ({ params: { slug } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { params } = context;
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: body.text,
              type: body.type,
              spans: [...body.spans],
            };
          }),
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 60, // 1 hour
  };
};
