import { Typography } from '~/components/Typography/Typography.js';
import { sanitizeConfig } from '~/helpers/sanitizeConfig.js';
import { withConfig } from '~/hocs/withConfig.js';
import { Quote12 } from '~/icons/Quote12.js';
import { BemBlockClassNames } from '~/styles/bem/BemBlockClassNames.js';
import { createClasses } from '~/styles/createClasses.js';
import { styled } from '~/styles/styled.js';

import type { QuoteProps } from './Quote.types.js';

import './Quote.scss';

const block = new BemBlockClassNames('tgui-quote');

/**
 * @see Figma: https://www.figma.com/file/AwAi6qE11mQllHa1sOROYp/Telegram-Mini-Apps-·%C2%A0UI-Kit?type=design&node-id=151-1301&mode=design&t=m05h6QLGMZhDICKu-0
 */
export const Quote = withConfig(
  styled((props: QuoteProps) => {
    const classes = createClasses(props);
    const sanitized = sanitizeConfig(props, ['classes']);

    return (
      <Typography class={classes().root} variant="subheadline2">
        {(componentProps) => (
          <blockquote {...sanitized} class={componentProps.class}>
            {props.children}
            <Quote12 class={classes().icon}/>
          </blockquote>
        )}
      </Typography>
    );
  }, {
    root: (props) => block.calc({ mix: props.class }),
    icon: block.elem('icon').calc(),
  }),
);
