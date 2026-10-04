/**
 * Structured debug logger for Pokemon Unbound Save Editor.
 * Provides color-coded scope prefixes for easy filtering in browser DevTools.
 */

const IS_DEV = import.meta.env.DEV || true;

function formatBadge(label, bgColor, textColor = '#ffffff') {
    return [
        `%c${label}`,
        `background: ${bgColor}; color: ${textColor}; font-weight: bold; border-radius: 4px; padding: 2px 6px; font-size: 11px;`,
    ];
}

export const logger = {
    editor(action, data = undefined) {
        if (!IS_DEV) return;
        const [badge, badgeStyle] = formatBadge('PUSE:Editor', '#7c3aed');
        if (data !== undefined) {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #c4b5fd; font-weight: 600;', data);
        } else {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #c4b5fd; font-weight: 600;');
        }
    },

    party(action, data = undefined) {
        if (!IS_DEV) return;
        const [badge, badgeStyle] = formatBadge('PUSE:Party', '#2563eb');
        if (data !== undefined) {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #93c5fd; font-weight: 600;', data);
        } else {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #93c5fd; font-weight: 600;');
        }
    },

    pc(action, data = undefined) {
        if (!IS_DEV) return;
        const [badge, badgeStyle] = formatBadge('PUSE:PC', '#059669');
        if (data !== undefined) {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #6ee7b7; font-weight: 600;', data);
        } else {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #6ee7b7; font-weight: 600;');
        }
    },

    bag(action, data = undefined) {
        if (!IS_DEV) return;
        const [badge, badgeStyle] = formatBadge('PUSE:Bag', '#d97706');
        if (data !== undefined) {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #fde68a; font-weight: 600;', data);
        } else {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #fde68a; font-weight: 600;');
        }
    },

    save(action, data = undefined) {
        if (!IS_DEV) return;
        const [badge, badgeStyle] = formatBadge('PUSE:Save', '#db2777');
        if (data !== undefined) {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #fbcfe8; font-weight: 600;', data);
        } else {
            console.log(`${badge} %c${action}`, badgeStyle, 'color: #fbcfe8; font-weight: 600;');
        }
    },

    error(scope, message, err = undefined) {
        const [badge, badgeStyle] = formatBadge(`PUSE:${scope}:ERROR`, '#dc2626');
        if (err !== undefined) {
            console.error(`${badge} %c${message}`, badgeStyle, 'color: #fca5a5; font-weight: bold;', err);
        } else {
            console.error(`${badge} %c${message}`, badgeStyle, 'color: #fca5a5; font-weight: bold;');
        }
    },
};
