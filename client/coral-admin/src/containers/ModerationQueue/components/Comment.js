import React, {PropTypes} from 'react';
import timeago from 'timeago.js';
import Linkify from 'react-linkify';
import Highlighter from 'react-highlight-words';
import {Link} from 'react-router';

import styles from './styles.css';
import {Icon} from 'coral-ui';
import FlagBox from './FlagBox';
import CommentType from './CommentType';
import ActionButton from 'coral-admin/src/components/ActionButton';
import BanUserButton from 'coral-admin/src/components/BanUserButton';
import {getActionSummary} from 'coral-framework/utils';

const linkify = new Linkify();

import I18n from 'coral-framework/modules/i18n/i18n';
import translations from 'coral-admin/src/translations.json';
const lang = new I18n(translations);

const Comment = ({actions = [], comment, suspectWords, bannedWords, ...props}) => {
  const links = linkify.getMatches(comment.body);
  const linkText = links ? links.map(link => link.raw) : [];
  const flagActionSummaries = getActionSummary('FlagActionSummary', comment);
  const flagActions = comment.actions && comment.actions.filter(a => a.__typename === 'FlagAction');
  let commentType = '';
  if (comment.status === 'PREMOD') {
    commentType = 'premod';
  } else if (flagActions && flagActions.length) {
    commentType = 'flagged';
  }

  // since words are checked against word boundaries on the backend,
  // this should be the behavior on the front end as well.
  // currently the highlighter plugin does not support this out of the box.
  const searchWords = [...suspectWords, ...bannedWords].filter(w => {
    return new RegExp(`(^|\\s)${w}(\\s|$)`).test(comment.body);
  }).concat(linkText);

  return (
    <li tabIndex={props.index} className={`mdl-card ${props.selected ?  'mdl-shadow--16dp' : 'mdl-shadow--2dp'} ${styles.Comment} ${styles.listItem} ${props.selected ? styles.selected : ''}`}>
      <div className={styles.container}>
        <div className={styles.itemHeader}>
          <div className={styles.author}>
            <span>
              {comment.user.name}
            </span>
            <span className={styles.created}>
              {timeago().format(comment.created_at || (Date.now() - props.index * 60 * 1000), lang.getLocale().replace('-', '_'))}
            </span>
            <BanUserButton user={comment.user} onClick={() => props.showBanUserDialog(comment.user, comment.id, comment.status !== 'REJECTED')} />
            <CommentType type={commentType} />
          </div>
          {comment.user.status === 'banned' ?
            <span className={styles.banned}>
              <Icon name='error_outline'/>
              {lang.t('comment.banned_user')}
            </span>
            : null}
        </div>
        <div className={styles.moderateArticle}>
          Story: {comment.asset.title}
          {!props.currentAsset && (
            <Link to={`/admin/moderate/${comment.asset.id}`}>Moderate →</Link>
          )}
        </div>
        <div className={styles.itemBody}>
          <p className={styles.body}>
            <Highlighter
              searchWords={searchWords}
              textToHighlight={comment.body} /> <a className={styles.external} href={`${comment.asset.url}#${comment.id}`} target="_blank"><Icon name='open_in_new' /> {lang.t('comment.view_context')}</a>
          </p>
          <div className={styles.sideActions}>
            {links ? <span className={styles.hasLinks}><Icon name='error_outline'/> Contains Link</span> : null}
            <div className={`actions ${styles.actions}`}>
              {actions.map((action, i) => {
                const active = (action === 'REJECT' && comment.status === 'REJECTED') ||
                               (action === 'APPROVE' && comment.status === 'ACCEPTED');
                return <ActionButton key={i}
                  type={action}
                  user={comment.user}
                  status={comment.status}
                  active={active}
                  acceptComment={() => props.acceptComment({commentId: comment.id})}
                  rejectComment={() => props.rejectComment({commentId: comment.id})} />;
              })}
            </div>
          </div>
        </div>
      </div>
      {
        flagActions && flagActions.length
        ? <FlagBox actions={flagActions} actionSummaries={flagActionSummaries} />
        : null
      }
    </li>
  );
};

Comment.propTypes = {
  acceptComment: PropTypes.func.isRequired,
  rejectComment: PropTypes.func.isRequired,
  suspectWords: PropTypes.arrayOf(PropTypes.string).isRequired,
  bannedWords: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentAsset: PropTypes.object,
  comment: PropTypes.shape({
    body: PropTypes.string.isRequired,
    action_summaries: PropTypes.array,
    actions: PropTypes.array,
    created_at: PropTypes.string.isRequired,
    user: PropTypes.shape({
      status: PropTypes.string
    }),
    asset: PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string,
      id: PropTypes.string
    })
  })
};

export default Comment;
