// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BlockNoteEditor } from '@blocknote/core';
import { withCollaboration } from '@blocknote/core/yjs';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

// Creates a BlockNote editor and mounts it into `element`
// `options.view` contains the BlockNoteView props (theme, editable, etc),
// everything else is passed to BlockNoteEditor.create
// If 'collaboration' is set, options are wrapped using withCollaboration
const useBlockNoteEditor = (element, { view = {}, ...options } = {}) => {
    const editor = BlockNoteEditor.create(
        options.collaboration ? withCollaboration(options) : options
    );
    const root = createRoot(element);
    root.render(React.createElement(BlockNoteView, { editor, ...view }));
    return {
        editor,
        ydoc: options.collaboration?.fragment?.doc,
        provider: options.collaboration?.provider,
        unmount: () => root.unmount()
    };
};

export default { useBlockNoteEditor, YJS: Y, IndexeddbPersistence };
