<?php

return [
    'POST' => [
        'select'      => ['CrudController', 'select'],
        'insert'      => ['CrudController', 'insert'],
        'update'      => ['CrudController', 'update'],
        'delete'      => ['CrudController', 'delete'],
        'bulk-insert' => ['CrudController', 'bulkInsert'],

        'restock'     => ['StockController', 'restock'],
        'consume'     => ['StockController', 'consume'],
        'get_logs'    => ['StockController', 'getLogs'],

        'upload'      => ['UploadController', 'uploadImage'],
    ],

    'GET' => [
        'get_stock'   => ['StockController', 'getStock'],
    ]
];
