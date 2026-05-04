<?php

require_once __DIR__ . '/../models/StockModel.php';

class StockController {
    private StockModel $model;

    public function __construct(PDO $pdo) {
        $this->model = new StockModel($pdo);
    }

    public function getStock(): void {
        $rows = $this->model->getAllStock();
        respond($rows);
    }

    public function restock(array $input): void {
        $supplier   = $input['supplier_id'] ?? null;
        $commodity  = $input['commodity_id'] ?? null;
        $qty        = $input['qty'] ?? null;

        if (!$supplier || !$commodity || !$qty) {
            respond(null, 400, 'Missing supplier_id, commodity_id, or qty');
        }

        $id = $this->model->addLog([
            ':supplier_id'  => $supplier,
            ':commodity_id' => $commodity,
            ':direction'    => 'IN',
            ':movement_type' => 'purchase',
            ':qty'          => $qty
        ]);

        respond(['restock_id' => $id]);
    }

    public function consume(array $input): void {
        $commodity  = $input['commodity_id'] ?? null;
        $qty        = $input['qty'] ?? null;

        if (!$commodity || !$qty) {
            respond(null, 400, 'Missing commodity_id or qty');
        }

        $id = $this->model->addLog([
            ':supplier_id'  => 0,
            ':commodity_id' => $commodity,
            ':direction'    => 'OUT',
            ':movement_type' => 'consumption',
            ':qty'          => $qty
        ]);

        respond(['consume_id' => $id]);
    }

    public function getLogs(array $input): void {
        $commodityId = $input['commodity_id'] ?? null;
        $supplierId  = $input['supplier_id'] ?? null;

        $items = $this->model->getLogs(
            $commodityId ? (int)$commodityId : null,
            $supplierId ? (int)$supplierId : null
        );

        respond($items);
    }
}
