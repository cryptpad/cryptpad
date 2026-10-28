// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockNoteEditor } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';

// Creates a BlockNote editor and mounts it into `element`
// `options.view` contains the BlockNoteView props (theme, editable, etc),
// everything else is passed to BlockNoteEditor.create (ex: collaboration, provider)
const useBlockNoteEditor = (element, { view = {}, ...options } = {}) => {
    const editor = BlockNoteEditor.create(options);
    const root = createRoot(element);
    root.render(React.createElement(BlockNoteView, { editor, ...view }));
    return {
        editor,
        unmount: () => root.unmount()
    };
};

export default { useBlockNoteEditor };
