import {InfoOutlined as InfoOutlinedIcon} from '@mui/icons-material';
import {IconButton, InputAdornment, TextField, Tooltip, tooltipClasses, type TextFieldProps} from '@mui/material';

type TooltipTextFieldProps = TextFieldProps & {
  tooltip: string;
};

export function TooltipTextField({tooltip, slotProps, ...props}: TooltipTextFieldProps) {
  const infoAdornment = (
    <InputAdornment position="end">
      <Tooltip
        title={tooltip}
        enterTouchDelay={0}
        leaveTouchDelay={4000}
        placement="top"
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: 'grey.900',
              color: 'common.white',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              maxWidth: 260,
              px: 1.5,
              py: 1,
              [`& .${tooltipClasses.arrow}`]: {color: 'grey.900'},
            },
          },
        }}
        arrow
      >
        <IconButton size="small" tabIndex={-1} edge="end">
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );

  const blockArrowKeys =
    props.type === 'number'
      ? (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        }
      : undefined;

  return (
    <TextField
      {...props}
      onKeyDown={blockArrowKeys}
      slotProps={{
        ...slotProps,
        input: {
          endAdornment: infoAdornment,
          ...(slotProps?.input as object | undefined),
        },
      }}
    />
  );
}
